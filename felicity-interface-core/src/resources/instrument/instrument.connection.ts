import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { InstrumentService } from './instrument.service';
import { InstrumentGateway } from './instrument.gateway';
import { InstrumentHandlerService } from './instrument.handler';
import * as net from 'net';
import { SerialPort } from 'serialport';

@Injectable()
export class InstrumentConnectionService {
  clientSessions = new Map();
  serverSessions = new Map();
  serialSessions = new Map();
  constructor(
    @Inject(forwardRef(() => InstrumentService))
    private instrumentService: InstrumentService,
    private instrumentGateway: InstrumentGateway,
    @Inject(forwardRef(() => InstrumentHandlerService))
    private instrumentParserService: InstrumentHandlerService,
  ) {}

  async initialize() {
    // reconnection
    const instruments = await this.instrumentService.findAll();
    instruments?.forEach(async (instrument) => {
      await this.addSessions(instrument);
    });
  }

  async addSessions(instrument) {
    if (instrument.connectionType === 'tcpip') {
      if (instrument.isClient) {
        this.addClientSession(instrument);
      } else {
        this.addServerSession(instrument);
      }
    }
    if (instrument.connectionType === 'serial') {
      await this.addSerialSession(instrument);
    }
  }

  async removeSessions(instrument) {
    if (instrument.isClient) {
      this.removeClientSession(instrument.id, '');
    } else {
      this.removeServerSession(instrument.id, '');
    }
  }

  getClientSession(id: string) {
    return this.clientSessions.get(id);
  }

  updateClientSession(id: string, update: any) {
    return this.clientSessions.set(id, update);
  }

  getServerSession(id: string) {
    return this.serverSessions.get(id);
  }

  updateServerSession(id: string, update: any) {
    return this.serverSessions.set(id, update);
  }

  getSerialSession(id: string) {
    return this.serialSessions.get(id);
  }

  updateSerialSession(id: string, update: any) {
    return this.serialSessions.set(id, update);
  }

  async addServerSession(instrument) {
    if (!this.serverSessions.has(instrument.id) || instrument.autoReconnect) {
      this.instrumentGateway.eventEmit('session', {
        id: instrument.id,
        message: 'connecting',
        connecting: true,
        connected: false,
      });
      console.log('Listening for connection on port: ', instrument.port);
      const server = net.createServer();
      server.listen(instrument.port);
      let serverSocket = null;

      server.on('connection', (socket) => {
        console.log('server connection established from: ', instrument.port);
        this.instrumentGateway.eventEmit('session', {
          id: instrument.id,
          message: 'connected',
          connecting: false,
          connected: true,
        });

        socket.on('data', (data) => {
          console.log('server data received from: ', instrument.port);
          this.instrumentParserService.socketReader(data, instrument, socket);
        });

        socket.on('close', (data) => ({}));

        serverSocket = socket;
      });

      server.on('error', (e) => {
        console.log(
          'server connnection errored from: ',
          instrument.port,
          ' with error: ',
          e,
        );
        this.removeServerSession(instrument.id, e.toString());
        if (instrument.autoReconnect) {
          setTimeout(() => {
            this.addServerSession(instrument);
          }, 30000);
        }
      });

      this.serverSessions.set(instrument.id, {
        server,
        sokcet: serverSocket,
        statement: '',
      });

      return {
        type: 'up',
        id: instrument.id,
        target: 'server',
        status: 200,
        message: 'instrument tcp server session started',
      };
    }

    console.log('server connection already up: ', instrument.port);
    return {
      type: 'up',
      id: instrument.id,
      target: 'server',
      status: 200,
      message: 'instrument tcp server session already exists',
    };
  }

  async removeServerSession(id: string, message) {
    console.log('removing server session with id: ', id);
    try {
      const { server } = this.serverSessions.get(id);
      server.close();
      this.serverSessions.delete(id);
    } catch (error) {
      //
    }

    this.instrumentGateway.eventEmit('session', {
      id: id,
      message,
      connecting: false,
      connected: false,
    });
  }

  async addClientSession(instrument) {
    if (!this.clientSessions.has(instrument.id) || instrument.autoReconnect) {
      this.instrumentGateway.eventEmit('session', {
        id: instrument.id,
        message: 'connecting',
        connecting: true,
        connected: false,
      });
      const client = new net.Socket();
      if (!instrument.port || !instrument.host) {
        return;
      }
      const connectopts = {
        host: instrument.host,
        port: instrument.port,
      };
      console.log('Client Trying to connect to : ', connectopts);
      client.connect(connectopts, () => {
        console.log('Client Connection establiched to: ', connectopts);
        this.instrumentGateway.eventEmit('session', {
          id: instrument.id,
          message: 'connected',
          connecting: false,
          connected: true,
        });
      });

      client.on('data', (data) => {
        console.log('Client data received from: ', connectopts);
        this.instrumentParserService.socketReader(data, instrument, client);
      });

      client.on('close', function () {
        console.log('client connnection closed from: ', connectopts);
      });

      client.on('error', (e) => {
        console.log(
          'client connnection errored from: ',
          connectopts,
          ' with error: ',
          e,
        );
        this.removeClientSession(instrument.id, e.toString());
        if (instrument.autoReconnect) {
          setTimeout(() => {
            this.addClientSession(instrument);
          }, 30000);
        }
      });
      //
      this.clientSessions.set(instrument.id, {
        client,
        statements: '',
      });

      return {
        type: 'up',
        id: instrument.id,
        target: 'client',
        status: 200,
        message: 'instrument tcp client session started',
      };
    }

    console.log('client connection already up: ', instrument.port);
    return {
      type: 'up',
      id: instrument.id,
      target: 'client',
      status: 200,
      message: 'instrument tcp client session already exists',
    };
  }

  async removeClientSession(id: string, message) {
    console.log('removing client session with id: ', id);
    try {
      const {
        instance: { client, _ },
      } = this.clientSessions.get(id);
      client.destroy();
      this.clientSessions.delete(id);
    } catch (error) {
      //
    }

    this.instrumentGateway.eventEmit('session', {
      id: id,
      message,
      connecting: false,
      connected: false,
    });
  }

  async addSerialSession(instrument) {
    if (!this.serialSessions.has(instrument.id) || instrument.autoReconnect) {
      const sPort = new SerialPort({
        path: instrument.path,
        baudRate: instrument.baudRate,
        autoOpen: false,
      });

      sPort.on('open', () => {
        this.instrumentGateway.eventEmit('session', {
          id: instrument.id,
          message: 'connected',
          connecting: false,
          connected: true,
        });
      });

      sPort.on('error', (err) => __handleError(err));

      sPort.open((err) => {
        if (err) {
          __handleError(err);
        }
      });

      sPort.on('data', (data) => {
        this.instrumentParserService.serialReader(data, instrument, sPort);
      });

      //
      this.serialSessions.set(instrument.id, {
        serial: sPort,
        transmission: [],
        statement: {},
      });

      // serial handlers
      const __handleError = (err) => {
        console.log('serial connnection errored  with error: ', err);
        this.removeSerialSession(instrument.id, err.toString());
        if (instrument.autoReconnect) {
          setTimeout(() => {
            this.addSerialSession(instrument);
          }, 30000);
        }
      };

      return {
        type: 'up',
        id: instrument.id,
        target: 'serial',
        status: 200,
        message: 'instrument serial session started',
      };
    }

    console.log('serial connection already up: ', instrument.path);
    return {
      type: 'up',
      id: instrument.id,
      target: 'serial',
      status: 200,
      message: 'instrument serial session already exists',
    };
  }

  async removeSerialSession(id: string, message) {
    console.log('removing serial session with id: ', id);
    try {
      const { sPort } = this.serialSessions.get(id);
      sPort.close();
      this.serialSessions.delete(id);
    } catch (error) {
      //
    }

    this.instrumentGateway.eventEmit('session', {
      id: id,
      message,
      connecting: false,
      connected: false,
    });
  }
}
