'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _cul = require('cul');

var _cul2 = _interopRequireDefault(_cul);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var CulProxy = function CulProxy(options) {
    var _this = this;

    _classCallCheck(this, CulProxy);

    this.write = function (data, callback) {
        if (data) {
            _this.queue.push({ data: data, callback: callback });
        }

        if (!_this.busy && _this.queue.length > 0) {
            _this.busy = true;

            var _queue$shift = _this.queue.shift(),
                _data = _queue$shift.data,
                _callback = _queue$shift.callback;

            _this.cul.write(_data, function () {
                if (_callback) _callback(_data);
                _this.busy = false;
                _this.write();
            });
        }
    };

    this.close = function (callback) {
        _this.cul.close(callback);
    };

    this.on = function (type, listener) {
        _this.cul.on(type, listener);
    };

    this.cul = new _cul2.default(options);
    this.queue = [];
    this.busy = false;
};

var CulAdapter = function CulAdapter(props) {
    var _this2 = this;

    _classCallCheck(this, CulAdapter);

    this.init = function () {
        _this2.logger.info('CUL connected to serialport ' + _this2.options.serialport);
        _this2.cul = new CulProxy(_this2.options);
        _this2.cul.on('ready', function () {
            _this2.cul.write('V');
            _this2.cul.write('X67');
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = _this2.preInitQueue[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var item = _step.value;
                    var data = item.data,
                        callback = item.callback;
                    // this.cul.write(data, callback);
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }

            _this2.logger.info('CUL initialized');
            _this2.isInitialized = true;
            _this2.eventDispatcher.dispatch('cul.connect');
        });
        _this2.cul.on('data', function (raw, obj) {
            _this2.eventDispatcher.dispatch('cul.data.received', { raw: raw, obj: obj });
        });
    };

    this.send = function (data, callback) {
        if (_this2.isInitialized) {
            _this2.logger.debug('[cul2mqtt > cul ]', data);
            _this2.cul.write(data, callback);
        } else {
            _this2.preInitQueue.push({ data: data, callback: callback });
        }
    };

    this.connected = false;
    this.logger = props.logger;
    this.eventDispatcher = props.eventDispatcher;
    this.preInitQueue = [];
    this.isInitialized = false;

    this.options = {
        serialport: props.options.serialport,
        initCmd: 0x67,
        mode: props.options.mode || 'SlowRF',
        init: props.options.init || true,
        parse: props.options.parse || true,
        coc: props.options.coc || false,
        scc: props.options.scc || false,
        rssi: props.options.rssi || true
    };
    this.protocols = props.protocols;
};

exports.default = CulAdapter;