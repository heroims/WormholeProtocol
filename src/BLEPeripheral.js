const BLEPeripheralMeta = require('@abandonware/bleno');

class PeripheralCharacteristic extends BLEPeripheralMeta.Characteristic{

    onWriteRequest(data, offset, withoutResponse, callback){
        if (offset) {
            callback(this.RESULT_ATTR_NOT_LONG);
          }
          else if (data.length !== 2) {
            callback(this.RESULT_INVALID_ATTRIBUTE_LENGTH);
          }
          else {
            this.value = data;
            if(this.updateValueCallback){
                this.updateValueCallback(data);
            }
            if(this.updateValueWithInfoCallback){
                this.updateValueWithInfoCallback(data,this.uuid,this.serviceUUID,this.central);
            }
            callback(this.RESULT_SUCCESS);
          }
    }

    onReadRequest(offset,callback){
        if (offset) {
            callback(this.RESULT_ATTR_NOT_LONG, null);
          }
          else {
            callback(this.RESULT_SUCCESS, this.value);
          }
    }

    sendNotification(value) {
        if(this.updateValueCallback) {
            this.value = value;
            this.updateValueCallback(value);
        }
    }
}

class Peripheral {
    constructor(){
        this.services = {};
        this.localName = '';
        this.autoStart = false;
        this.metaObject = BLEPeripheralMeta;
        BLEPeripheralMeta.on('stateChange', state => {
            if(state == 'poweredOn'){
                startAdvertising();
            }
        });
        BLEPeripheralMeta.on('accept',address=>{
            if(!this.connectCentral){
                this.connectCentral = address;
                Object.values(this.services).forEach(service => {
                    service.characteristics.forEach(characteristic => {
                        characteristic.central = this.connectCentral;
                    });
                });
            }
        });
    }

    addService(uuid){
        this.services[uuid]={}
    }

    addCharacteristicToService(serviceUUID, characteristic){
        var tmpService = this.services[serviceUUID];
        var tmpCharacteristics = tmpService.characteristics?JSON.parse(JSON.stringify(tmpService.characteristics)):[];
        tmpCharacteristics.push(characteristic);
        var newService = new BLEPeripheralMeta.PrimaryService({uuid:serviceUUID,characteristics:tmpCharacteristics});
        this.services[serviceUUID]=newService;
    }

    startAdvertising(callback){
        BLEPeripheralMeta.startAdvertising(this.localName,Object.keys(this.services),callback)
    }

    stopAdvertising(callback){
        BLEPeripheralMeta.stopAdvertising(callback);
    }

    sendNotification(serviceUUID,characteristicUUID,value){
        var tmpService = this.services[serviceUUID];
        if(tmpService){
            var tmpCharacteristic = tmpService.characteristics[characteristicUUID];
            if(tmpCharacteristic){
                tmpCharacteristic.sendNotification(value);
            }
        }
    }
}
exports.PeripheralCharacteristic=PeripheralCharacteristic;
module.exports = new Peripheral();