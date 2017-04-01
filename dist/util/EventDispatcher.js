"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _events = require("events");

var _events2 = _interopRequireDefault(_events);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var EventDispatcher = function EventDispatcher() {
    var _this = this;

    _classCallCheck(this, EventDispatcher);

    this.addEventListener = function (name, callback) {
        _this.eventDispatcher.on(name, callback);
    };

    this.dispatch = function (name, data) {
        _this.eventDispatcher.emit(name, data);
    };

    this.eventDispatcher = new _events2.default();
};

exports.default = EventDispatcher;