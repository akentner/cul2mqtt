export default class FHT {

    handleCulData = (data) => {
        const {protocol, address, message} = data;

        // cul by HobbyQuaker does not handle fully FHT so we handle it here
        console.log(data);

        if (protocol === 'FHT') {
            const value = message.toUpperCase();
            this.logger.info('cul data handled by FHT', JSON.stringify(data));


            // this.cul.send(`is${address.toUpperCase()}${value}`, () => {
            //     this.mqtt.publish(`status/IT/${address}`, value, {retain: true});
            // });
        }
    };

}


