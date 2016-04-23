#!/usr/bin/env node
var Mqtt =      require('mqtt');
var Cul =       require('cul');
var pkg =       require('./package.json');
var log =       require('yalm');
var config =    require('yargs')
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

log.loglevel =          config.verbosity;

log.info(pkg.name, pkg.version, 'starting');

log.info('mqtt trying to connect', config.url);
var mqtt = Mqtt.connect(config.url, {will: {topic: config.name + '/connected', payload: '0'}});
mqtt.publish(config.name + '/connected', '1');

var connected;

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
    switch (parsed[1]) {
        case 'FS20':
            data = 'F' + parsed[2].toUpperCase() + value.toUpperCase();
            log.debug('cul <', data);
            cul.write(data, function(err, res) {
                log.debug('cul >', res);
            });
            break;
        case 'IT':
            data = 'is' + parsed[2].toUpperCase() + value.toUpperCase();
            log.debug('cul <', data);
            cul.write(data, function(err, res) {
                log.debug('cul >', res);
            });
            break;
    }
});

var cul = new Cul({
    serialport: config.serialport,
    mode: 'SlowRF'
});

cul.on('ready', function () {
    mqtt.publish(config.name + '/connected', '2');
    cul.write('V');
    log.info('cul ready');
});

// TODO - read topicMap from json file, remove hardcoded personal stuff here.
var topicMap = {
    'EM/0205': 'Leistung Spülmaschine',
    'EM/0206': 'Leistung Trockner',
    'EM/0309': 'Gaszähler',
    'FS20/6C4800': 'Klingel',
    'FS20/B33100': 'RC8:1',
    'FS20/B33101': 'RC8:2',
    'FS20/B33102': 'RC8:3',
    'FS20/B33103': 'RC8:4',
    'FS20/446000': 'Gastherme Brenner',
    'FS20/446001': 'Gastherme Brenner',
    'WS/1/temperature': 'Temperatur Wohnzimmer',
    'WS/1/humidity': 'Luftfeuchte Wohnzimmer',
    'WS/4/temperature': 'Temperatur Garten',
    'WS/4/humidity': 'Luftfeuchte Garten',
    'HMS/A5E3/temperature': 'Temperatur Aquarium'
};

function map(topic) {
    return topicMap[topic] || topic;
}

cul.on('data', function (raw, obj) {
    log.debug('cul <', raw, obj);

    var prefix = config.name + '/status/';
    var topic;
    var val = {
        ts: new Date().getTime()
    };

    if (obj && obj.protocol && obj.data) {

        log.debug('obj', obj);

        switch (obj.protocol) {
            case 'EM':
                topic = prefix + obj.protocol + '/' + obj.address;
                val.val = obj.data.total;
                val.cul_em = obj.data;
                val.name = map(obj.protocol + '/' + obj.address);
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
                    val.name = map(obj.protocol + '/' + obj.address + '/' + el);
                    if (obj.rssi) val.cul_rssi = obj.rssi;
                    if (obj.device) val.cul_device = obj.device;
                    log.debug('mqtt >', topic, val);
                    mqtt.publish(topic, JSON.stringify(val), {retain: true});
                }
                break;

            case 'FS20':
                topic = prefix + 'FS20/' + obj.address;
                val.val = obj.data.cmdRaw;
                val.cul_fs20 = obj.data;
                val.name = map('FS20/' + obj.address);
                if (obj.rssi) val.cul_rssi = obj.rssi;
                if (obj.device) val.cul_device = obj.device;
                log.debug('mqtt >', topic, val.val, val.cul_fs20.cmd);
                mqtt.publish(topic, JSON.stringify(val), {retain: false});
                break;

            default:
                log.warn('unknown protocol', obj.protocol);
        }
    }
});
