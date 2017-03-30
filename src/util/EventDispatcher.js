import EventEmitter from "events";

export default class EventDispatcher {

    constructor() {
        this.eventDispatcher = new EventEmitter();
    }

    addEventListener = (name, callback) => {
        this.eventDispatcher.on(name, callback);
    };

    dispatch = (name, data) => {
        this.eventDispatcher.emit(name, data);
    };

}
