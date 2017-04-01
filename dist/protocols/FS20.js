'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// F<hex>
// Send out an FS20 message. <hex> is a hex string of the following form:
//     hhhhaacc or hhhhaaccee, where
// hhhh is the FS20 housecode,
//     aa is the FS20 device address,
//     cc is the FS20 command
// ee is the FS20 timespec. Note that cc must have the extension bit set.
//     Example: F12340111

var FS20 = function FS20(props) {
    var _this = this;

    _classCallCheck(this, FS20);

    this.handleMqttMessage = function (data) {
        var protocol = data.protocol,
            address = data.address,
            message = data.message;

        if (protocol === 'FS20') {
            _this.logger.info('message handled by FS20', address, message);
            _this.cul.send({
                protocol: 'is',
                address: address,
                value: message.toUpperCase()
            }, function (data) {
                _this.logger.debug('CUL callback', data);
                _this.mqtt.publish('status/FS20/' + data.address, data.message);
            });
        }
    };

    this.handleCulData = function (data) {
        var obj = data.obj;

        if (obj.protocol === 'FS20') {
            _this.logger.info('cul data handled by FS20', obj);
        }
    };

    this.logger = props.logger;
    this.eventDispatcher = props.eventDispatcher;
    this.cul = props.cul;
    this.mqtt = props.mqtt;
    this.eventDispatcher.addEventListener('mqtt.message.set.FS20', this.handleMqttMessage);
    this.eventDispatcher.addEventListener('cul.data.received', this.handleCulData);
};

exports.default = FS20;