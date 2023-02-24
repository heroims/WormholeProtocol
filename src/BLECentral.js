const BLECentralMeta = require('@abandonware/noble');

class Central{
    constructor(){
        this.metaObject = BLECentralMeta;
        this.peripherals = {};
        BLECentralMeta.on('discover', peripheral=>{
            this.peripherals[peripheral.address]=peripheral;
            peripheral.on('disconnect',(err)=>{
                if(!err){
                    BLECentralMeta.emit('DisconnectPeripheral', {
                        address:peripheral.address,
                        id:peripheral.id,
                        addressType:peripheral.addressType,
                        uuid:peripheral.uuid
                    });
                }
            });
        });
    }

    connect(address){
        const peripheral = this.peripherals[address];
        if(peripheral){
            return connectAsync(); 
        }
        else{
            return new Promise((fulfill, reject)=>{
                reject('not found');
            });
        }
    }

    disconnect(address){
        const peripheral = this.peripherals[address];
        if(peripheral){
            return disconnectAsync();
        }
        else{
            return new Promise((fulfill, reject)=>{
                reject('not found');
            });
        }
    }

    startNotification(address,serviceUUID,characteristicUUIDs){
        return new Promise((fulfill, reject)=>{
            const peripheral = this.peripherals[address];
            if(peripheral){
                peripheral.discoverServicesAsync([serviceUUID]).then(services=>{
                    services.forEach(service => {
                        service.discoverCharacteristicsAsync(characteristicUUIDs).then(characteristics=>{
                            characteristics.forEach(characteristic=>{
                                characteristic.subscribeAsync().then(()=>{
                                    fulfill(characteristic);
                                    characteristic.on('data',(data,isNotify)=>{
                                        BLECentralMeta.emit('DidUpdateValueForCharacteristic',{
                                            characteristic:characteristic.uuid,
                                            value:data,
                                            service:serviceUUID,
                                            peripheral:peripheral.address
                                        }); 
                                    });
                                }).catch(err=>{
                                    reject(err);
                                });
                            });
                        }).catch(err=>{
                            reject(err);
                        });
                    });
                })
                .catch(err=>{
                    reject(err);
                });
            }
            else{
                reject('not found');
                
            }
        });
    }

    stopNotification(address,serviceUUID,characteristicUUIDs){
        return new Promise((fulfill, reject)=>{
            const peripheral = this.peripherals[address];
            if(peripheral){
                var foundService = false;
                var foundCharacteristic = false;
                peripheral.services.forEach(service => {
                    if(service.uuid == serviceUUID){
                        foundService = true;
                        service.characteristics.forEach(characteristic=>{
                            characteristicUUIDs.forEach(characteristicUUID => {
                                if(characteristicUUID == characteristic.uuid){
                                    foundCharacteristic = true;
                                    characteristic.unsubscribeAsync().then(()=>{
                                        fulfill(characteristic);
                                    }).catch(err=>{
                                        reject(err);
                                    });
                                }
                            });
                        });
                    }
                });
                if(!foundService||!foundCharacteristic){
                    reject('not found');
                }
            }
            else{
                reject('not found');
            }
        });
    }

    write(address,serviceUUID,characteristicUUID,buffer){
        return new Promise((fulfill, reject)=>{
            const peripheral = this.peripherals[address];
            if(peripheral){
                var foundService = false;
                var foundCharacteristic = false;
                peripheral.services.forEach(service => {
                    if(service.uuid == serviceUUID){
                        foundService = true;
                        service.characteristics.forEach(characteristic=>{
                            if(characteristicUUID == characteristic.uuid){
                                foundCharacteristic = true;
                                characteristic.writeAsync(buffer).then(()=>{
                                    fulfill();
                                }).catch(err=>{
                                    reject(err);
                                });
                            }
                        });
                    }
                });
                if(!foundService||!foundCharacteristic){
                    reject('not found');
                }
            }
            else{
                reject('not found');
            }
        });
    }
}

module.exports = new Central();