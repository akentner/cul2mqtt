export default class CulAdapter {

    constructor(props) {
        this.connected = false;
        this.logger = props.logger;
        this.eventDispatcher = props.eventDispatcher;

        this.options = {
            serialport: props.options.serialport,
            initCmd: props.initCmd || 0x01,
            mode: props.options.mode || 'SlowRF',
            init: props.options.init || true,
            parse: props.options.parse || true,
            coc: props.options.coc || false,
            scc: props.options.scc || false,
            rssi: props.options.rssi || true,
        };
        this.protocols = props.protocols;

    }

    init = () => {
        this.logger.info('CUL connected to serialport ' + this.options.serialport);
        this.cul = new Cul({
            serialport: this.options.serialport,
            mode: this.options.mode,
            initCmd: 0x67,
        });

        this.cul.on('ready', function () {
            mqtt.publish(config.name + '/connected', '2');
            cul.write('V');
            cul.write('X67');
            this.eventDispatcher.dispatch('cul.connect');
        });
    };

    send = (data, callback) => {
        this.logger.debug('[cul2mqtt > cul ]', data);
        callback(data);
    }
}

