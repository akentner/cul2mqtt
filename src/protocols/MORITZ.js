import AbstractProtocolHandler from "./AbstractProtocolHandler";

export default class MORITZ extends AbstractProtocolHandler {

    handleCulData(data) {
        const {raw, obj} = data;
        if (obj.protocol === 'MORITZ') {
            if (obj.data && obj.data.culfw && obj.data.culfw.version) {
                this.logger.info('CUL', raw);
                this.mqtt.publish('status/_CUL', JSON.stringify(obj.data.culfw));
            }
        }
    }

}


