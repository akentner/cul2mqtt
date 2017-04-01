"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _MqttAdapter = require("./adapter/MqttAdapter");

var _MqttAdapter2 = _interopRequireDefault(_MqttAdapter);

var _CulAdapter = require("./adapter/CulAdapter");

var _CulAdapter2 = _interopRequireDefault(_CulAdapter);

var _winston = require("winston");

var _EventDispatcher = require("./util/EventDispatcher");

var _EventDispatcher2 = _interopRequireDefault(_EventDispatcher);

var _InterTechno = require("./protocols/InterTechno");

var _InterTechno2 = _interopRequireDefault(_InterTechno);

var _FS = require("./protocols/FS20");

var _FS2 = _interopRequireDefault(_FS);

var _MORITZ = require("./protocols/MORITZ");

var _MORITZ2 = _interopRequireDefault(_MORITZ);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var HEARTBEAT_TIMEOUT = 30000; // 30sec

var Cul2Mqtt = function () {
    function Cul2Mqtt(options) {
        _classCallCheck(this, Cul2Mqtt);

        _initialiseProps.call(this);

        this.options = options;
        try {
            this.configureEventDispatcher();
            this.configureLogger(options);
            this.logger.debug('bootstrapping CUL2MQTT', this.options);
            this.configureMqttAdapter(options);
            this.configureCulAdapter(options);
            this.configureProtocols();
        } catch (err) {
            if (this.logger) {
                this.logger.error(err);
            } else {
                console.error(err);
            }
            process.exit(1);
        }
    }

    _createClass(Cul2Mqtt, [{
        key: "configureProtocols",
        value: function configureProtocols() {
            this.protocols = {
                'IT': new _InterTechno2.default(this),
                'FS20': new _FS2.default(this),
                'MORITZ': new _MORITZ2.default(this)
            };
        }
    }, {
        key: "configureCulAdapter",
        value: function configureCulAdapter(options) {
            if (!options.cul.serialport) throw new Error('CUL adapter not properly configured');

            this.cul = new _CulAdapter2.default({
                logger: this.logger,
                eventDispatcher: this.eventDispatcher,
                options: {
                    serialport: options.cul.serialport
                }
            });
        }
    }, {
        key: "configureMqttAdapter",
        value: function configureMqttAdapter(options) {
            if (!options.mqtt.url) throw new Error('MQTT adapter not properly configured');

            this.mqtt = new _MqttAdapter2.default({
                logger: this.logger,
                eventDispatcher: this.eventDispatcher,
                options: {
                    topic: options.mqtt.topic,
                    url: options.mqtt.url
                }
            });
        }
    }, {
        key: "configureEventDispatcher",
        value: function configureEventDispatcher() {
            var _this = this;

            this.eventDispatcher = new _EventDispatcher2.default();
            this.eventDispatcher.addEventListener('mqtt.connect', function () {
                _this.mqtt.publish('connected', '1');
                _this.cul.init();
            });
            this.eventDispatcher.addEventListener('cul.connect', function () {
                _this.mqtt.publish('connected', '2');
                _this.heartbeat();
            });
        }
    }]);

    return Cul2Mqtt;
}();

var _initialiseProps = function _initialiseProps() {
    var _this2 = this;

    this.configureLogger = function (options) {
        _this2.logger = new _winston.Logger({
            level: options.logger.level,
            transports: [new _winston.transports.Console({
                colorize: 'level'
            })]
        });
    };

    this.heartbeat = function () {
        var date = new Date();
        _this2.logger.debug('heartbeat', date.toJSON());
        _this2.mqtt.publish('heartbeat', date.getTime().toString());
        setTimeout(_this2.heartbeat, HEARTBEAT_TIMEOUT);
    };

    this.run = function () {
        _this2.logger.info('starting CUL2MQTT', _this2.options);
        _this2.mqtt.init();
    };
};

var server = new Cul2Mqtt({
    mqtt: {
        url: process.env.MQTT_URL, //'mqtt://192.168.178.96',
        topic: process.env.MQTT_TOPIC || 'cul'
    },
    cul: {
        serialport: process.env.CUL_SERIALPORT
    },
    logger: {
        level: process.env.LOGGER_LEVEL || 'info'
    }
});
server.run();