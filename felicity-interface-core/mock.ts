import { SerialPort } from 'serialport';

// Create a port and enable the echo and recording.
const port = new SerialPort({ path: '/dev/pts/6', baudRate: 9600 });

port.on('error', (err: any) => console.error);
port.on('data', (data: any) => console.log);
