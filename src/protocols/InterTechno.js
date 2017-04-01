import AbstractProtocolHandler from "./AbstractProtocolHandler";
// i<func>
// InterTechno (R) mode.
// <func> is one of:
//     t<dez>
//     Sets the time in us (microseconds) for a single wave-puls typical values are: 360-470 Default: 420 (good for most InterTechno compatible Devices)
// sr<dez>
// Sets the number of repetition for the InterTechno Command. The command needs to be sent several times, as the receivers are comparing several receptions. Default: 6 Note: Some discounter versions are toggling too much, then reduce to ~4
// s<AAAAAAAAAAAA> Note: 12-Address/Data Bits
// Sends an InterTechno command A-Address/Data Bit is Tri-State 0 /1/F (float) (see Notes at the end)


export default class InterTechno extends AbstractProtocolHandler {

    handleMqttData(data) {
        const {protocol, address, message} = data;
        if (protocol === 'IT') {
            const value = message.toUpperCase();
            this.cul.send(`is${address.toUpperCase()}${value}`, () => {
                this.mqtt.publish(`status/IT/${address}`, value, {retain: true});
            });
        }
    }
}
