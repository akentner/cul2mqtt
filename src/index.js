import MqttAdapter from "./adapter/MqttAdapter";
import CulAdapter from "./adapter/CulAdapter";
import {Logger, transports} from "winston";
import EventDispatcher from "./util/EventDispatcher";
import InterTechno from "./protocols/InterTechno";
import FS20 from "./protocols/FS20";
import MORITZ from "./protocols/MORITZ";
import Debug from "./protocols/Debug";
import FHT from "./protocols/FHT";

const HEARTBEAT_TIMEOUT = 30000; // 30sec

class Cul2Mqtt {
    constructor(options) {
        this.options = options;
        try {
            this.configureEventDispatcher();
            this.configureLogger(options);
            this.logger.debug('bootstrapping CUL2MQTT', this.options);
            this.configureMqttAdapter(options);
            this.configureCulAdapter(options);
            this.configureProtocols();
        } catch (err) {
            if (this.logger) {
                this.logger.error(err);
            } else {
                console.error(err);
            }
            process.exit(1);
        }
    }

    configureProtocols() {
        this.protocols = {
            'IT': new InterTechno(this),
            'FS20': new FS20(this),
            'MORITZ': new MORITZ(this),
            'FHT': new FHT(this),
            'Debug': new Debug(this),
        };
    }

    configureCulAdapter(options) {
        if (!options.cul.serialport)
            throw new Error('CUL adapter not properly configured');

        this.cul = new CulAdapter({
            logger: this.logger,
            eventDispatcher: this.eventDispatcher,
            options: {
                serialport: options.cul.serialport,
            }
        });
    }

    configureMqttAdapter(options) {
        if (!options.mqtt.url)
            throw new Error('MQTT adapter not properly configured');

        this.mqtt = new MqttAdapter({
            logger: this.logger,
            eventDispatcher: this.eventDispatcher,
            options: {
                topic: options.mqtt.topic,
                url: options.mqtt.url,
            }
        });
    }

    configureEventDispatcher() {
        this.eventDispatcher = new EventDispatcher();
        this.eventDispatcher.addEventListener('mqtt.connect', () => {
            this.mqtt.publish('connected', '1');
            this.cul.init();
        });
        this.eventDispatcher.addEventListener('cul.connect', () => {
            this.mqtt.publish('connected', '2');
            this.heartbeat();
        });
    }

    configureLogger = (options) => {
        this.logger = new Logger({
            level: options.logger.level,
            transports: [
                new (transports.Console)({
                    colorize: 'level',
                })
            ]
        });
    };

    heartbeat = () => {
        let date = new Date();
        this.logger.debug('heartbeat', date.toJSON());
        this.mqtt.publish('heartbeat', date.getTime().toString());
        setTimeout(this.heartbeat, HEARTBEAT_TIMEOUT);
    };

    run = () => {
        this.logger.info('starting CUL2MQTT', this.options);
        this.mqtt.init();
    }
}

const server = new Cul2Mqtt({
    mqtt: {
        url: process.env.MQTT_URL, //'mqtt://192.168.178.96',
        topic: process.env.MQTT_TOPIC || 'cul',
    },
    cul: {
        serialport: process.env.CUL_SERIALPORT,
    },
    logger: {
        level: process.env.LOGGER_LEVEL || 'info',
    }
});
server.run();
