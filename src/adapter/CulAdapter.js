import Cul from "cul";

class CulProxy {

    constructor(options) {
        this.cul = new Cul(options);
        this.queue = [];
        this.busy = false;
    }

    write = (data, callback) => {
        if (data) {
            this.queue.push({data: data, callback: callback});
        }

        if (!this.busy && this.queue.length > 0) {
            this.busy = true;
            let {data, callback} = this.queue.shift();
            this.cul.write(data, () => {
                if (callback) callback(data);
                this.busy = false;
                this.write();
            });
        }
    };

    close = (callback) => {
        this.cul.close(callback);
    };

    on = (type, listener) => {
        this.cul.on(type, listener)
    }
}


export default class CulAdapter {

    constructor(props) {
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
            rssi: props.options.rssi || true,
        };
        this.protocols = props.protocols;
    }

    init = () => {
        this.logger.info('CUL connected to serialport ' + this.options.serialport);
        this.cul = new CulProxy(this.options);
        this.cul.on('ready', () => {
            this.cul.write('V');
            this.cul.write('X67');
            for (let item of this.preInitQueue) {
                const {data, callback} = item;
                // this.cul.write(data, callback);
            }
            this.logger.info('CUL initialized');
            this.isInitialized = true;
            this.eventDispatcher.dispatch('cul.connect');
        });
        this.cul.on('data', (raw, obj) => {
            this.eventDispatcher.dispatch('cul.data.received', {raw: raw, obj: obj});
        });
    };

    send = (data, callback) => {
        if (this.isInitialized) {
            this.logger.debug('[cul2mqtt > cul ]', data);
            this.cul.write(data, callback);
        } else {
            this.preInitQueue.push({data: data, callback: callback})
        }
    }
}

