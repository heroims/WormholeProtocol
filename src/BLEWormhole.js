const BLETransferManager = require('./BLETransferManager');
const BLEStorageMeta = require('electron-store');
const BLEStorage = new BLEStorageMeta();

class Wormhole {

    constructor() {
        this.scanning=false;        
    }

    CreateNativeEventEmitter(){
        BLETransferManager.centralMeta.on('discover', (device)=>{   
            var deviceName = device.address;
            if (device.advertisement){
                deviceName = device.advertisement.localName;
            }
            var tmpDevice={name:deviceName,serviceUUIDs:device.advertisement.serviceUuids===undefined?device.advertisement.serviceUuids:device.advertisement.serviceUuids.concat(),deviceID:device.id,connected:false}
            this.DiscoverDeviceHandler(tmpDevice)
        });

        BLETransferManager.centralMeta.on('DisconnectPeripheral', (device)=>{   
            this.DisconnectHandler(device)
        });

        BLETransferManager.centralMeta.on('scanStop', ()=>{   
            this.DiscoverDeviceStopHandler()
        });

        BLETransferManager.centralMeta.on('DidUpdateValueForCharacteristic', (data) => {
            var characteristic = {'uuid':data.characteristic,'value':data.value.concat(),'service':data.service,'device':data.peripheral}
            BLETransferManager.TransferReceive(null,characteristic,(err,buffers)=>{
                characteristic.value=buffers;
                this.ReceiveHandler(characteristic);
            });    
        });
        
        BLETransferManager.peripheralMeta.on('disconnect',(central)=>{
            this.DisconnectHandler(central);
        });

        BLETransferManager.peripheralMeta.on('didReceiveWrite',([err,data])=>{
            if (err){
              console.error(err);
              this.ReceiveHandler(undefined); 
            }
            else{
              var characteristic = {'uuid':data.uuid,'value':data.value.concat(),'service':data.service,'device':data.central}
              BLETransferManager.TransferReceive(null,characteristic,(err,buffers)=>{
                characteristic.value=buffers;
                this.ReceiveHandler(characteristic);
              });  
            }
        });
    }

    CreatServer(serviceUUID,characteristicUUIDs,name = ''){
        var deviceName = name;
        if(deviceName === ''){
            deviceName = this.deviceUUID;
        }
        BLETransferManager.SetPeripheralName(deviceName);
        for (const characteristicUUID of characteristicUUIDs) {
            BLETransferManager.AddPeripheralCharacteristicToService(serviceUUID,characteristicUUID,['read','write','notify'])
        }
        BLETransferManager.AddPeripheralServer(serviceUUID);
    }

    Start(receiveHandler){
        this.ReceiveHandler=receiveHandler;
        return BLETransferManager.StartTransfer();
    }

    StartPeripheral(){
        return BLETransferManager.StartPeripheral();
    }

    SendBuffer(deviceName,deviceID,serviceUUID,characteristicUUID,sendBuffer){
        BLETransferManager.TransferSend(sendBuffer,buffers=>{
            if(this.deviceUUID==deviceName){
                var deviceIDs=[deviceID];
                if(deviceID == undefined || deviceID == null){
                    deviceIDs = [];
                }
                BLETransferManager.SendToCentral([],serviceUUID,characteristicUUID,buffers);
            }
            else{
                BLETransferManager.SendToPeripheral(deviceID,serviceUUID,characteristicUUID,buffers).then()
            }
        });
    }

    Scan(serviceUUIDs,seconds,allowDuplicates,discoverDeviceHandler,discoverDeviceStopHandler){
        if(discoverDeviceHandler!=undefined){
            this.DiscoverDeviceHandler=discoverDeviceHandler;
        }
        if(discoverDeviceStopHandler!=undefined){
            this.DiscoverDeviceStopHandler=discoverDeviceStopHandler;
        }
        return new Promise((fulfill, reject)=>{
            BLETransferManager.Scan(serviceUUIDs,seconds,allowDuplicates)
            .then(res=>{
                this.scanning = true;
                fulfill(res);
            })
            .catch(err=>{
                this.scanning = false;
                reject(err);
            });
        });
    }

    StopScan(){
        if(this.scanning){
            this.scanning=false;
            return BLETransferManager.StopScan();
        }
        else{
            return new Promise((fulfill, reject)=>{
                this.scanning=false
                fulfill(true);
                reject('');
            });
        }
    }

    Connect(deviceID,serviceUUID,characteristicUUIDs){
        return new Promise((fulfill, reject)=>{
            BLETransferManager.ConnectPeripheral(deviceID)
            .then(()=>{
                BLETransferManager.StartNotification(deviceID,serviceUUID,characteristicUUIDs)
                .then((characteristic)=>{
                    fulfill(characteristic);
                })
                .catch(err=>{
                    reject(err);
                })
            })
            .catch(err=>{
                reject(err);
            })
        });
    }

    StopNotification(deviceID,serviceUUID,characteristicUUID){
        return BLETransferManager.StopNotification(deviceID,serviceUUID,characteristicUUID);
    }

    Disconnect(deviceID){
        return BLETransferManager.DisconnectPeripheral(deviceID)
    }

    GenerateDeviceID(){
        return new Promise((fulfill, reject)=>{
            try {
                if(BLEStorage.has('deviceInfo.uuid')){
                    this.deviceUUID = BLEStorage.get('deviceInfo.uuid');
                    fulfill(this.deviceUUID);
                    return ;
                }
            } catch (err) {
                
            }
            
            try {
                this.deviceUUID = this.Generate8BitUUID().toUpperCase();
                fulfill(this.deviceUUID);
                BLEStorage.set({
                    deviceInfo:{
                        uuid: this.deviceUUID
                    }
                }) 
            } catch (err1) {
                reject(err1);
            }
        })
    }

    GenerateBLEUUID() {
        var d = new Date().getTime();
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          var r = (d + Math.random()*16)%16 | 0;
          d = Math.floor(d/16);
          return (c=='x' ? r : (r&0x3|0x8)).toString(16);
        });
        return uuid;
    }

    Generate8BitUUID() {
        var d = new Date().getTime();
        var uuid = 'xxxxxxxx'.replace(/[xy]/g, function(c) {
          var band = 36;
          var r = (d + Math.random()*band)%band | 0;
          d = Math.floor(d/band);
          return (c=='x' ? r : (r&0x5|0x7)).toString(band);
        });
        return uuid;
    }
}

export default BLEWormhole = new Wormhole();