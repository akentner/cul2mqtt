// F<hex>
// Send out an FS20 message. <hex> is a hex string of the following form:
//     hhhhaacc or hhhhaaccee, where
// hhhh is the FS20 housecode,
//     aa is the FS20 device address,
//     cc is the FS20 command
// ee is the FS20 timespec. Note that cc must have the extension bit set.
//     Example: F12340111

export default class FS20 {

    constructor(props) {
        this.logger = props.logger;
        this.eventDispatcher = props.eventDispatcher;
        this.cul = props.cul;
        this.mqtt = props.mqtt;
        this.eventDispatcher.addEventListener('mqtt.message.set.FS20', this.handleMqttMessage);
        this.eventDispatcher.addEventListener('cul.data.received', this.handleCulData);
    }

    handleMqttMessage = (data) => {
        const {protocol, address, message} = data;
        if (protocol === 'FS20') {
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
        }
    };

    handleCulData = (data) => {
        const {obj} = data;
        if (obj.protocol === 'FS20') {
            this.logger.info('cul data handled by FS20', obj);
        }
    };

}


