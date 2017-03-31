import MqttAdapter from "./mqtt/MqttAdapter";
import CulAdapter from "./cul/CulAdapter";
import {Logger, transports} from "winston";
import EventDispatcher from "./util/EventDispatcher";
import IT from "./protocols/IT";
import FS20 from "./protocols/FS20";

const TIMEOUT = 30000;

class Cul2Mqtt {
    constructor(options) {
        this.options = options;
        this.eventDispatcher = new EventDispatcher();
        this.eventDispatcher.addEventListener('mqtt.connect', () => {
            this.mqtt.publish('connected', '1');
            this.cul.init();
        });
        this.eventDispatcher.addEventListener('cul.connect', () => {
            this.mqtt.publish('connected', '2');
            this.heartbeat();
        });

        this.logger = new Logger({
            level: options.logger.level,
            transports: [
                new (transports.Console)({
                    colorize: 'level',
                })
            ]
        });

        this.mqtt = new MqttAdapter({
            logger: this.logger,
            eventDispatcher: this.eventDispatcher,
            options: {
                topic: options.mqtt.topic,
                url: options.mqtt.url,
            }
        });

        this.cul = new CulAdapter({
            logger: this.logger,
            eventDispatcher: this.eventDispatcher,
            options: {
                tty: options.cul.tty,
            }
        });

        this.protocols = {
            'IT': new IT(this),
            'FS20': new FS20(this),
        };
    }

    heartbeat = () => {
        let date = new Date();
        this.logger.debug('heartbeat', date.toJSON());
        this.mqtt.publish('heartbeat', date.toJSON());
        setTimeout(this.heartbeat, TIMEOUT);
    };

    run = () => {
        this.logger.info('starting CUL2MQTT', this.options);
        this.mqtt.init();
    }
}

const server = new Cul2Mqtt({
    mqtt: {
        url: process.env.MQTT_URL, //'mqtt://192.168.178.96',
        topic: process.env.MQTT_TOPIC, //'cul433'
    },
    cul: {
        serialport: process.env.CUL_SERIALPORT, //'asd'
    },
    logger: {
        level: process.env.LOGGER_LEVEL || 'info',
    }
});
server.run();
