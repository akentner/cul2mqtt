export default class IT {

    constructor(props) {
        this.logger = props.logger;
        this.eventDispatcher = props.eventDispatcher;
        this.cul = props.cul;
        this.mqtt = props.mqtt;
        this.eventDispatcher.addEventListener('mqtt.message.set.IT', this.handleMqttMessage);
        this.eventDispatcher.addEventListener('cul.data.receive.IT', this.handleCulData);
    }

    handleMqttMessage = (data) => {
        const {address, message} = data;
        this.cul.send(
            {
                protocol: 'is',
                address: address,
                value: message.toUpperCase()
            },
            (data) => {
                this.mqtt.publish('status/IT/' + data.address, data.value)
            }
        );
    };

    handleCulData = (data) => {
        this.logger.info('[cul  > mqtt2cul]', data);
    };

}


