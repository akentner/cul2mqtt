import AbstractProtocolHandler from "./AbstractProtocolHandler";

export default class MORITZ extends AbstractProtocolHandler {

    handleCulData(data) {
        const {obj} = data;
        if (obj.protocol === 'MORITZ') {
            delete(obj.protocol);
            if (obj.data && obj.data.culfw && obj.data.culfw.version) {
                this.logger.info('CUL ', obj);
                this.mqtt.publish('status/_CUL', JSON.stringify(obj.data.culfw));
            }
        }
    }

}


