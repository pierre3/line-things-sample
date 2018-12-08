var bleno = require('bleno');
var onoff = require('onoff');

const USER_SERVICE_UUID = '1d9113b9-b790-46cb-a55a-2e666525e0c3';
const WRITE_CHARACTERISTIC_UUID = 'E9062E71-9E62-4BC6-B0D3-35CDCD9B027B';
const NOTIFY_CHARACTERISTIC_UUID = '62FBD229-6EDD-4D1A-B554-5C4E1BB29169';

const PSDI_SERVICE_UUID ='E625601E-9E55-4597-A598-76018A0D293D';
const PSDI_CHARACTERISTIC_UUID = '26E2B12B-85F0-4F3F-9FDD-91D114270E6E';
const DEVICE_NAME = 'line-things-device';

console.log(`bleno - ${DEVICE_NAME}`);

var PrimaryService = bleno.PrimaryService;
var Gpio = onoff.Gpio;

let onOff = 0;

const Characteristic = bleno.Characteristic;
const writeCharacteristic = new Characteristic({
    uuid: WRITE_CHARACTERISTIC_UUID,
    properties: ['write'],
    onWriteRequest: (data, offset, withoutResponse, callback) => {
        console.log(`onOff = ${data[0]}`)

        var led = new Gpio(12,"out");     
        led.writeSync(data[0]);          
        callback(Characteristic.RESULT_SUCCESS);
    }
});

const notifyCharacteristic = new Characteristic({
    uuid: NOTIFY_CHARACTERISTIC_UUID,
    properties: ['notify'],
    onSubscribe: (maxSize, callback) => {
        console.log('subscribe');
        setInterval(function() {
            onOff ^= 1;
            callback(new Buffer([onOff]));
          }, 2000);
     }
});

const psdiCharacteristic = new Characteristic({
    uuid: PSDI_CHARACTERISTIC_UUID,
    properties: ['read'],
    onReadRequest: (offset, callback) => {
        console.log('PSDI read');
        const result = Characteristic.RESULT_SUCCESS;
        const data = new Buffer.from('PSDI read');
        callback(result, data);
    }
});

bleno.on('stateChange', (state) => {
    console.log(`on -> stateChange: ${state}`);
    if (state === 'poweredOn') {
        bleno.startAdvertising(DEVICE_NAME, [USER_SERVICE_UUID]);
    } else {
        bleno.stopAdvertising();
    }
});

bleno.on('advertisingStart', (error) => {
    console.log(`on -> advertisingStart: ${(error ? 'error ' + error : 'success')}`);
    if(error) return;

    const userService = new PrimaryService({
        uuid: USER_SERVICE_UUID,
        characteristics: [writeCharacteristic,notifyCharacteristic]
    }); 
    const psdiService = new PrimaryService({
        uuid: PSDI_SERVICE_UUID,
        characteristics: [psdiCharacteristic]
    });

    bleno.setServices([userService,psdiService]);
});
