"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _AbstractProtocolHandler = require("./AbstractProtocolHandler");

var _AbstractProtocolHandler2 = _interopRequireDefault(_AbstractProtocolHandler);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

// i<func>
// InterTechno (R) mode.
// <func> is one of:
//     t<dez>
//     Sets the time in us (microseconds) for a single wave-puls typical values are: 360-470 Default: 420 (good for most InterTechno compatible Devices)
// sr<dez>
// Sets the number of repetition for the InterTechno Command. The command needs to be sent several times, as the receivers are comparing several receptions. Default: 6 Note: Some discounter versions are toggling too much, then reduce to ~4
// s<AAAAAAAAAAAA> Note: 12-Address/Data Bits
// Sends an InterTechno command A-Address/Data Bit is Tri-State 0 /1/F (float) (see Notes at the end)


var InterTechno = function (_AbstractProtocolHand) {
    _inherits(InterTechno, _AbstractProtocolHand);

    function InterTechno() {
        _classCallCheck(this, InterTechno);

        return _possibleConstructorReturn(this, (InterTechno.__proto__ || Object.getPrototypeOf(InterTechno)).apply(this, arguments));
    }

    _createClass(InterTechno, [{
        key: "handleMqttData",
        value: function handleMqttData(data) {
            var _this2 = this;

            var protocol = data.protocol,
                address = data.address,
                message = data.message;

            if (protocol === 'IT') {
                var value = message.toUpperCase();
                this.cul.send("is" + address.toUpperCase() + value, function () {
                    _this2.mqtt.publish("status/IT/" + address, value, { retain: true });
                });
            }
        }
    }]);

    return InterTechno;
}(_AbstractProtocolHandler2.default);

exports.default = InterTechno;