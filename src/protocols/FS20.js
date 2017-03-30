export default class FS20 {

    constructor(props) {
        this.logger = props.logger;
        this.eventDispatcher = props.eventDispatcher;
        this.cul = props.cul;
        this.mqtt = props.mqtt;
        this.eventDispatcher.addEventListener('mqtt.message.set.FS20', this.handleMqttMessage);
        // this.eventDispatcher.addEventListener('cul.data.receive.f', this.handleCulData);
    }

    handleMqttMessage = (data) => {
        const {address, message} = data;
        this.logger.info('message handled by FS20', address, message);
        this.cul.send(
            {
                protocol: 'is',
                address: address,
                value: message.toUpperCase()
            },
            (data) => {
                this.logger.debug('CUL callback', data);
                this.mqtt.publish('status/FS20/' + data.address, data.message)
            }
        );
    };

    handleCulData = (data) => {
        this.logger.info('cul data handled by FS20', data);
    };

}


