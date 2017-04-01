'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var AbstractProtocolHandler = function () {

  /**
   *
   * @param props
   */
  function AbstractProtocolHandler(props) {
    _classCallCheck(this, AbstractProtocolHandler);

    this.logger = props.logger;
    this.eventDispatcher = props.eventDispatcher;
    this.cul = props.cul;
    this.mqtt = props.mqtt;
    this.eventDispatcher.addEventListener('mqtt.set.received', this.handleMqttData.bind(this));
    this.eventDispatcher.addEventListener('cul.data.received', this.handleCulData.bind(this));
  }

  /**
   *
   * @param data
   */


  _createClass(AbstractProtocolHandler, [{
    key: 'handleMqttData',
    value: function handleMqttData(data) {}
  }, {
    key: 'handleCulData',


    /**
     *
     * @param data
     */
    value: function handleCulData(data) {}
  }]);

  return AbstractProtocolHandler;
}();

exports.default = AbstractProtocolHandler;