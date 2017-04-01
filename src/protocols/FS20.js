// F<hex>
// Send out an FS20 message. <hex> is a hex string of the following form:
//     hhhhaacc or hhhhaaccee, where
// hhhh is the FS20 housecode,
//     aa is the FS20 device address,
//     cc is the FS20 command
// ee is the FS20 timespec. Note that cc must have the extension bit set.
//     Example: F12340111

export default class FS20 {

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
        const {protocol, address, message} = data;
        if (protocol === 'FS20') {
            const value = message.toUpperCase();
            this.logger.info('cul data handled by FS20', JSON.stringify(data));


            // this.cul.send(`is${address.toUpperCase()}${value}`, () => {
            //     this.mqtt.publish(`status/IT/${address}`, value, {retain: true});
            // });
        }
    };

}


