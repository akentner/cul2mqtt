import AbstractProtocolHandler from "./AbstractProtocolHandler";

export default class Debug extends AbstractProtocolHandler {

    handleCulData(data) {
        const {raw, obj} = data;
        this.logger.debug('[cul > debug]', JSON.stringify(obj), raw);
    }

}


