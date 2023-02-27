# WormholeProtocol
Bluetooth Low Energy Offline Communication Protocol

## Installation
```bash
npm install ble-manager --save
```

## Usage
### CreateNativeEventEmitter
```javascript
BLEWormhole.CreateNativeEventEmitter();
```
### CreatServer
```javascript
BLEWormhole.CreatServer(bleServiceUUID, connectCharaUUIDs, name);
```
### Event handler
```javascript
BLEWormhole.DisconnectHandler = deviceID => {
    console.log('disconnect', deviceID);
};
BLEWormhole.ReceiveHandler = characteristic => {
    //characteristic = {'uuid':'','value':Buffer.from(''),'service':'','device':''}

};
BLEWormhole.DiscoverDeviceStopHandler = () => {
    console.log('stop scan');
};
BLEWormhole.DiscoverDeviceHandler = device => {
    //device =  {name:'',serviceUUIDs:['',''],deviceID:'',connected:false}
};
BLEWormhole.BluetoothStateHandler = state => {
/* `unknown`
* `resetting`
* `unsupported`
* `unauthorized`
* `poweredOff`
* `poweredOn`
*/
};

```
### GenerateDeviceID
```javascript
BLEWormhole.GenerateDeviceID()
  .then(res => {})
  .catch(err => {
    console.error(err);
  });
```
### CheckState
```javascript
BLEWormhole.CheckState();
```
### Scan
```javascript
BLEWormhole.Scan([bleServiceUUID], dicoveredSeconds, true);
```
### StopScan
```javascript
BLEWormhole.StopScan()
```
### Start
`receiveHandler` can replace `BLEWormhole.ReceiveHandler`
```javascript
BLEWormhole.Start(receiveHandler)
  .then(res => {})
  .catch(err => {
    console.error(err);
  });
```
### Connect
```javascript
BLEWormhole.Connect(device.deviceID, bleServiceUUID, connectCharaUUIDs)
  .then(res => {
    console.log('connect:' + res);
  })
  .catch(err => {
    console.error(err);
});
```
### Disconnect
```javascript
BLEWormhole.Disconnect(device.deviceID)
  .then(res => {})
  .catch(err => {
    console.error(err);
  });
```
### StopNotification
```javascript
BLEWormhole.StopNotification(deviceID,serviceUUID,characteristicUUID)
  .then(res => {})
  .catch(err => {
    console.error(err);
  });
```
### Send
```javascript
BLEWormhole.SendBuffer(
            connectedDeviceName,
            connectedDeviceID,
            bleServiceUUID,
            incomingCharaUUID,
            data,
          );
```
