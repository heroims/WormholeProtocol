const BLECentral = require('./BLECentral')
const BLEPeripheral = require('./BLEPeripheral');;
const Buffer = require('buffer');
const events = require('events');

const EndFlag=0xfe;
const PartFlag=0xfd;
// const StartFlag=0xfc;
const MaxSendSize=20;
const PushSplitSize=18;

class TransferManager {
    constructor() {
        this.tmpWaitArr = {};
        this.peripheralMeta = BLEPeripheral.metaObject;
        this.centralMeta = BLECentral.metaObject;
    }

    SetDeviceCharacteristicUUID(uuid){
        this.deviceCharacteristicUUID = uuid;
    }

    SetPeripheralName(localName){
        BLEPeripheral.localName = localName;
    }

    AddPeripheralServer(serviceUUID){
        BLEPeripheral.addService(serviceUUID)
    }

    AddPeripheralCharacteristicToService(bleServiceUUID,deviceCharacteristicUUID,properties){
        var characteristic = new BLEPeripheral.PeripheralCharacteristic({
            uuid:deviceCharacteristicUUID,
            properties:properties,
            value:'',
        })
        characteristic.serviceUUID = bleServiceUUID;
        characteristic.updateValueWithInfoCallback = (data, characteristicUUID, serviceUUID, central)=>{
            if(data){
                BLEPeripheral.metaObject.emit('didReceiveWrite', ['',{uuid:characteristicUUID,value:data,service:serviceUUID,central:central}])
            }
            else{
                BLEPeripheral.metaObject.emit('didReceiveWrite', ['error',{}])
            }
        }
        BLEPeripheral.addCharacteristicToService(bleServiceUUID,characteristic)
    }

    StartTransfer(){
        return new Promise((fulfill, reject)=>{
            this.StartPeripheral()
            .then(res1=>{
                fulfill({'res1':res1});
            })
            .catch(err1=>{
                reject(err1);
            });
        });
    }

    StartPeripheral(){
       return BLEPeripheral.startAdvertising(arg=>{})
    }

    Scan(serviceUUIDs,allowDuplicates){
        return BLECentral.metaObject.startScanningAsync(serviceUUIDs,allowDuplicates);
    }

    StopScan(){
        return BLECentral.metaObject.stopScanningAsync();
    }

    ConnectPeripheral(peripheralID){
        return BLECentral.connect(peripheralID);
    }

    DisconnectPeripheral(peripheralID){
        return BLECentral.disconnect(peripheralID);
    }

    StopNotification(peripheralID,serviceUUID,characteristicUUID){
        return BLECentral.stopNotification(peripheralID,serviceUUID,[characteristicUUID]);
    }

    StartNotification(peripheralID,serviceUUID,characteristicUUIDs){
        return BLECentral.startNotification(peripheralID,serviceUUID,characteristicUUIDs);
    }

    GenerateUUID() {
        var d = new Date().getTime();
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          var r = (d + Math.random()*16)%16 | 0;
          d = Math.floor(d/16);
          return (c=='x' ? r : (r&0x3|0x8)).toString(16);
        });
        return uuid;
    }

    SendToPeripheral(peripheralID,serviceUUID,characteristicUUID,buffer){
        return BLECentral.write(peripheralID,serviceUUID,characteristicUUID,buffer)
    }

    SendToCentral(serviceUUID,characteristicUUID,buffer){
        BLEPeripheral.sendNotification(serviceUUID,characteristicUUID,buffer)
    }

    TransferSend(buffer, cb){
        var dataArr=[];
        var dataBuffer=buffer;
        if(dataBuffer.length<MaxSendSize){
          for (const iterator of dataBuffer) {
            dataArr.push(iterator);
          }
          dataArr.push(EndFlag)
          cb(dataArr)
        }
        else
        {
          for (let index = 0; index < dataBuffer.length; index++) {
            const element = dataBuffer[index];
            
            if(index==dataBuffer.length-1){
              dataArr.push(element);
              dataArr.push(EndFlag);
              cb(dataArr)
              dataArr=[];
            }
            else if(index%PushSplitSize==0){
              dataArr.push(PartFlag);
              cb(dataArr)
              dataArr=[element];
            }
            else{
              dataArr.push(element);
            }
          }
        }
    }

    TransferReceive(err,characteristic,cb,tag=''){
        if (err){
            cb(err,null)
        }
        else{
            var tmpDataArr=characteristic.value.concat();
            var tmpDataBuffer=Buffer.from(characteristic.value);
            if(this.tmpWaitArr[characteristic.uuid+tag]==undefined){
               this.tmpWaitArr[characteristic.uuid+tag]=[];
            }

            if(tmpDataBuffer[tmpDataBuffer.length-1]==EndFlag){
              tmpDataArr.pop();

              this.tmpWaitArr[characteristic.uuid+tag]=this.tmpWaitArr[characteristic.uuid+tag].concat(tmpDataArr);

              cb(err,Buffer.from(this.tmpWaitArr[characteristic.uuid+tag]))

              delete this.tmpWaitArr[characteristic.uuid+tag];
            }
            else if(tmpDataBuffer[tmpDataBuffer.length-1]==PartFlag){
              tmpDataArr.pop();

              this.tmpWaitArr[characteristic.uuid+tag]=this.tmpWaitArr[characteristic.uuid+tag].concat(tmpDataArr);
            }
            else{
               cb(err,Buffer.from(tmpDataArr));
            }
        }
    }
}

module.exports = new TransferManager();