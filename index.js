#!/usr/bin/env node
var Mqtt = require('mqtt');
var Cul = require('cul');
var pkg = require('./package.json');
var log = require('yalm');
var config = require('yargs')
    .usage(pkg.name + ' ' + pkg.version + '\n' + pkg.description + '\n\nUsage: $0 [options]')
    .describe('v', 'possible values: "error", "warn", "info", "debug"')
    .describe('n', 'topic prefix')
    .describe('u', 'mqtt broker url. See https://github.com/mqttjs/MQTT.js#connect-using-a-url')
    .describe('h', 'show help')
    .describe('s', 'CUL serial port')
    .alias({
        'h': 'help',
        'n': 'name',
        'u': 'url',
        'v': 'verbosity',
        's': 'serialport'
    })
    .default({
        'u': 'mqtt://127.0.0.1',
        'n': 'cul',
        'v': 'info',
        's': '/dev/ttyACM0'
    })
    //.config('config')
    .version(pkg.name + ' ' + pkg.version + '\n', 'version')
    .help('help')
    .argv;

var configDevices;
try {
    configDevices = require('./config.json');
} catch (e) {
    configDevices = {};
}

var connected, mqtt, cul;
var culBusy = false;
var culQueue = [];

var mqttDebounceState = {};

log.loglevel = config.verbosity;
log.info(pkg.name, pkg.version, 'starting');
log.info('configDevices', configDevices);
log.info('mqtt trying to connect', config.url);

mqtt = Mqtt.connect(config.url, {will: {topic: config.name + '/connected', payload: '0'}});
mqtt.publish(config.name + '/connected', '1');

mqtt.on('connect', function () {
    connected = true;
    log.info('mqtt connected ' + config.url);
    mqtt.subscribe(config.name + '/set/#');
});

mqtt.on('close', function () {
    if (connected) {
        connected = false;
        log.info('mqtt closed ' + config.url);
    }
});

mqtt.on('error', function () {
    log.error('mqtt error ' + config.url);
});

mqtt.on('message', function (topic, message) {
    var data;
    var pattern = '^' + config.name + '/set/(.+)/(.+)';
    var regExp = new RegExp(pattern);
    var value = message.toString();
    var parsed = regExp.exec(topic);

    log.debug('mqtt >', topic, parsed[1], parsed[2], value);

    function culSendQueued(data) {
        var cmd;
        if (data) {
            culQueue.push(data);
        }
        if (!culBusy && culQueue.length > 0) {
            culBusy = true;
            data = culQueue.shift();
            cmd = data.protocol + data.address + data.value;
            log.debug('cul <', data);
            cul.write(cmd, function (err, res) {
                if (err) {
                    Log.error('cul > ERROR: ', err, res)
                } else {
                    log.debug('cul >', res);
                    ackSendStatus(data);
                }
                culBusy = false;
                culSendQueued();
            });
        }
    }

    function ackSendStatus(data) {
        var prefix = config.name + '/status/';
        switch (data.protocol) {
            case 'is':
                mqtt.publish(prefix + 'IT/' + data.address, data.value, {retain: true});
                break;
        }
    }

    switch (parsed[1]) {
        case 'FS20':
            culSendQueued({protocol: 'F', address: parsed[2].toUpperCase(), 'value': value.toUpperCase()});
            break;
        case 'IT':
            culSendQueued({protocol: 'is', address: parsed[2].toUpperCase(), 'value': value.toUpperCase()});
            break;
        case 'RAW':
            culSendQueued({protocol: '', address: parsed[2], 'value': value});
            break;
    }
});

cul = new Cul({
    serialport: config.serialport,
    mode: 'SlowRF'
});

cul.on('ready', function () {
    mqtt.publish(config.name + '/connected', '2');
    cul.write('V');
    cul.write('X67');
    log.info('cul ready');
});


function getObjectConf(obj) {
    var conf;
    conf = configDevices.devices[obj.protocol] || {};
    conf = conf[obj.address] || {};
    conf.protocol = obj.protocol;
    conf.address = obj.address;

    return conf;
}

function translateCulValue(val, objConf) {
    var translation = val;
    Object.keys(objConf.values || {}).forEach(function (idx) {
        if (objConf.values[idx] === val) {
            translation = idx;
        }
    });

    return translation;
}

function mqttPublishDebounced(topic, val, retain, debounce) {
    var path = topic + '_' + val.val;
    if (!mqttDebounceState[path]) {
        log.debug('mqtt >', topic, val.val, val.cul_fs20.cmd);
        mqtt.publish(topic, JSON.stringify(val), {retain: retain});
        mqtt.publish(topic + '/' + val.val, JSON.stringify(val), {retain: false});
        mqttDebounceState[path] = setTimeout(function () {
            clearTimeout(mqttDebounceState[path]);
            mqttDebounceState[path] = null;
        }, debounce);
    }
}
cul.on('data', function (raw, obj) {
    log.debug('cul <', raw, obj);

    var objConf;
    var prefix = config.name + '/status/';
    var topic;
    var val = {
        ts: new Date().getTime()
    };

    if (obj && obj.protocol && obj.data) {
        objConf = getObjectConf(obj);
        log.debug('objConf', objConf);

        switch (obj.protocol) {
            case 'EM':
                topic = prefix + obj.protocol + '/' + obj.address;
                val.val = obj.data.total;
                val.cul_em = obj.data;
                val.name = obj.protocol + '/' + obj.address;
                if (obj.rssi) val.cul_rssi = obj.rssi;
                if (obj.device) val.cul_device = obj.device;
                log.debug('mqtt >', topic, val);
                mqtt.publish(topic, JSON.stringify(val), {retain: true});
                break;

            case 'HMS':
            case 'WS':
                for (var el in obj.data) {
                    topic = prefix + obj.protocol + '/' + obj.address + '/' + el;
                    val.val = obj.data[el];
                    val.name = obj.protocol + '/' + obj.address + '/' + el;
                    if (obj.rssi) val.cul_rssi = obj.rssi;
                    if (obj.device) val.cul_device = obj.device;
                    log.debug('mqtt >', topic, val);
                    mqtt.publish(topic, JSON.stringify(val), {retain: true});
                }
                break;

            case 'FS20':
                topic = prefix + 'FS20/' + obj.address;
                val.val = translateCulValue(obj.data.cmdRaw, objConf);
                val.cul_fs20 = obj.data;
                val.name = objConf.name || 'FS20/' + obj.address;

                if (obj.rssi) val.cul_rssi = obj.rssi;
                if (obj.device) val.cul_device = obj.device;

                mqttPublishDebounced(topic, val, objConf.retain || false, objConf.debounce || 0);

                break;

            default:
                obj.raw = raw;
                mqtt.publish(prefix + 'RAW', JSON.stringify(obj), {retain: false});
                log.warn('unknown protocol', obj.protocol);
        }
    } else {
        obj.raw = raw;
        mqtt.publish(prefix + 'RAW', JSON.stringify(obj), {retain: false});
    }
});
