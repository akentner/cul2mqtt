export default class AbstractProtocolHandler {

    /**
     *
     * @param props
     */
    constructor(props) {
        this.logger = props.logger;
        this.eventDispatcher = props.eventDispatcher;
        this.cul = props.cul;
        this.mqtt = props.mqtt;
        this.eventDispatcher.addEventListener('mqtt.set.received', this.handleMqttData.bind(this));
        this.eventDispatcher.addEventListener('cul.data.received', this.handleCulData.bind(this));
    }

    /**
     *
     */
    handleMqttData() {
    };

    /**
     *
     */
    handleCulData() {
    };

}


