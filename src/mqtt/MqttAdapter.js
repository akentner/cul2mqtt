import mqtt from "mqtt";

function onConnect() {
    this.connected = true;
    this.logger.info('mqtt connected to ' + this.options.url + ' with topic "' + this.options.topic + '"');
    // this.mqtt.subscribe(this.options.topic + '/set/#');
    this.mqtt.subscribe(this.options.topic + '/#');
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
    const regExp = new RegExp('^' + this.options.topic + '/set/(.+)/(.+)');
    this.logger.debug('[mqtt > cul2mqtt]', topic, message.toString());
    let parsed;
    if (parsed = regExp.exec(topic)) {
        const [topic, protocol, address] = parsed;
        this.eventDispatcher.dispatch('mqtt.message.set.' + protocol.toUpperCase(), {
            address: address.toUpperCase(),
            message: message.toString().toUpperCase()
        });
    }
}

export default class MqttAdapter {

    constructor(props) {
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
        //                 mqtt.publish(prefix + 'IT/' + data.address, data.value, {retain: true});
        //                 break;
        //         }
        //     }
        //
        //     switch (parsed[1]) {
        //         case 'FS20':
        //             culSendQueued({protocol: 'F', address: parsed[2].toUpperCase(), 'value': value.toUpperCase()});
        //             break;
        //         case 'IT':
        //             culSendQueued({protocol: 'is', address: parsed[2].toUpperCase(), 'value': value.toUpperCase()});
        //             break;
        //         case 'RAW':
        //             culSendQueued({protocol: '', address: parsed[2], 'value': value});
        //             break;
        //     }
        // });
    }

    init = () => {
        this.mqtt = mqtt.connect(
            this.options.url,
            {
                will: {
                    topic: this.options.topic + '/connected',
                    payload: '0'
                }
            }
        );
        this.mqtt.on('connect', onConnect.bind(this));
        this.mqtt.on('close', onClose.bind(this));
        this.mqtt.on('error', onError.bind(this));
        this.mqtt.on('message', onMessage.bind(this));

    };

    publish = (topic, message) => {
        this.logger.debug('[cul2mqtt > mqtt]', this.options.topic + '/' + topic, message);
        this.mqtt.publish(this.options.topic + '/' + topic, message);
    }
}
