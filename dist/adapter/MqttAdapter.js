'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _mqtt = require('mqtt');

var _mqtt2 = _interopRequireDefault(_mqtt);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function onConnect() {
    this.connected = true;
    this.logger.info('MQTT connected to ' + this.options.url + ' with topic "' + this.options.topic + '"');
    this.mqtt.subscribe(this.options.topic + '/set/#');
    // this.mqtt.subscribe(this.options.topic + '/status/#');
    this.eventDispatcher.dispatch('mqtt.connect');
}

function onClose() {
    if (this.connected) {
        this.connected = false;
        this.logger.info('mqtt closed ' + this.options.url);
    }
    this.eventDispatcher.dispatch('mqtt.close');
}

function onError(err) {
    this.logger.error('mqtt error ' + err);
    this.eventDispatcher.dispatch('mqtt.error', err);
}

function onMessage(topic, message) {
    var regExp = new RegExp('^' + this.options.topic + '/set/(.+)/(.+)');
    this.logger.debug('[mqtt > cul2mqtt]', topic, message.toString());
    var parsed = void 0;
    if (parsed = regExp.exec(topic)) {
        var _parsed = parsed,
            _parsed2 = _slicedToArray(_parsed, 3),
            _topic = _parsed2[0],
            protocol = _parsed2[1],
            address = _parsed2[2];

        this.eventDispatcher.dispatch('mqtt.set.received', {
            topic: _topic,
            protocol: protocol,
            address: address.toUpperCase(),
            message: message.toString()
        });
    }
}

var MqttAdapter = function MqttAdapter(props) {
    var _this = this;

    _classCallCheck(this, MqttAdapter);

    this.init = function () {
        _this.mqtt = _mqtt2.default.connect(_this.options.url, {
            will: {
                topic: _this.options.topic + '/connected',
                payload: '0'
            }
        });
        _this.mqtt.on('connect', onConnect.bind(_this));
        _this.mqtt.on('close', onClose.bind(_this));
        _this.mqtt.on('error', onError.bind(_this));
        _this.mqtt.on('message', onMessage.bind(_this));
    };

    this.publish = function (topic, message, opts, callback) {
        _this.logger.debug('[cul2mqtt > mqtt]', _this.options.topic + '/' + topic, message);
        _this.mqtt.publish(_this.options.topic + '/' + topic, message, opts, callback);
    };

    this.connected = false;
    this.logger = props.logger;
    this.eventDispatcher = props.eventDispatcher;
    this.options = props.options;
    this.protocols = props.protocols;

    // mqtt.on('message', function (topic, message) {
    //     var data;
    //     var pattern = '^' + config.name + '/set/(.+)/(.+)';
    //     var regExp = new RegExp(pattern);
    //     var value = message.toString();
    //     var parsed = regExp.exec(topic);
    //
    //     log.debug('mqtt >', topic, parsed[1], parsed[2], value);
    //
    //     function culSendQueued(data) {
    //         var cmd;
    //         if (data) {
    //             culQueue.push(data);
    //         }
    //         if (!culBusy && culQueue.length > 0) {
    //             culBusy = true;
    //             data = culQueue.shift();
    //             cmd = data.protocol + data.address + data.value;
    //             log.debug('cul <', data);
    //             cul.write(cmd, function (err, res) {
    //                 if (err) {
    //                     Log.error('cul > ERROR: ', err, res)
    //                 } else {
    //                     log.debug('cul >', res);
    //                     ackSendStatus(data);
    //                 }
    //                 culBusy = false;
    //                 culSendQueued();
    //             });
    //         }
    //     }
    //
    //     function ackSendStatus(data) {
    //         var prefix = config.name + '/status/';
    //         switch (data.protocol) {
    //             case 'is':
    //                 mqtt.publish(prefix + 'InterTechno/' + data.address, data.value, {retain: true});
    //                 break;
    //         }
    //     }
    //
    //     switch (parsed[1]) {
    //         case 'FS20':
    //             culSendQueued({protocol: 'F', address: parsed[2].toUpperCase(), 'value': value.toUpperCase()});
    //             break;
    //         case 'InterTechno':
    //             culSendQueued({protocol: 'is', address: parsed[2].toUpperCase(), 'value': value.toUpperCase()});
    //             break;
    //         case 'RAW':
    //             culSendQueued({protocol: '', address: parsed[2], 'value': value});
    //             break;
    //     }
    // });
};

exports.default = MqttAdapter;