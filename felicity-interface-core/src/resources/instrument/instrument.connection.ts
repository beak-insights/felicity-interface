import { Injectable } from '@nestjs/common';
import { InstrumentService } from './instrument.service';
import { InstrumentGateway } from './instrument.gateway';
import { InstrumentParserService } from './instrument.parser';
import * as net from 'net';

@Injectable()
export class InstrumentConnectionService {
  clientSessions = new Map();
  serverSessions = new Map();
  constructor(
    private instrumentService: InstrumentService,
    private instrumentGateway: InstrumentGateway,
    private instrumentParserService: InstrumentParserService,
  ) {}

  async initialize() {
    // reconnection
    const instruments = await this.instrumentService.findAll();
    instruments?.forEach(async (instrument) => {
      await this.addSessions(instrument);
    });
  }

  async addSessions(instrument) {
    if (instrument.server) {
      this.addServerSession(instrument);
    }
    if (instrument.client) {
      this.addClientSession(instrument);
    }
  }

  async addServerSession(instrument) {
    if (!this.serverSessions.has(instrument.id)) {
      if (instrument.connectionType === 'tcpip') {
        // Listening for connection on port  instrument.serverPort
        const server = net.createServer();
        server.listen(instrument.serverPort);
        let serverSocket = null;

        server.on('connection', (socket) => {
          socket.on('data', (data) => {
            this.instrumentParserService.handleSocketData(
              data,
              instrument,
              'server',
              socket,
            );
          });

          socket.on('close', (data) => ({}));

          serverSocket = socket;
        });

        server.on('error', function (e) {
          this.removeServerSession(instrument.id);
          if (instrument.autoReconnect) {
            setTimeout(() => {
              this.addServerSession(instrument);
            }, 30000);
          }
        });

        this.serverSessions.set(instrument.id, {
          server,
          sokcet: serverSocket,
        });

        return {
          type: 'up',
          id: instrument.id,
          target: 'server',
          status: 200,
          message: 'instrument tcp server session started',
        };
      }
    }
    return {
      type: 'up',
      id: instrument.id,
      target: 'server',
      status: 200,
      message: 'instrument tcp server session already exists',
    };
  }

  async removeServerSession(id: string) {
    try {
      const { server } = this.serverSessions.get(id);
      server.close();
      this.serverSessions.delete(id);
    } catch (error) {
      //
    }

    this.instrumentGateway.eventEmit('session', {
      id,
      message: 'disconnected',
      target: 'server',
      connected: false,
    });
  }

  async addClientSession(instrument) {
    if (!this.serverSessions.has(instrument.id)) {
      const client = new net.Socket();
      if (!instrument.clientPort || !instrument.clientHost) {
        return;
      }
      const connectopts = {
        port: instrument.clientPort,
        host: instrument.clientHost,
      };
      client.connect(connectopts, function () {
        // set connection status
      });

      client.on('data', (data) => {
        this.instrumentParserService.handleSocketData(
          data,
          instrument,
          'client',
          client,
        );
      });

      client.on('close', function () {
        //
      });

      client.on('error', () => {
        this.removeClientSession(instrument.onstrumentId);
        if (instrument.autoReconnect) {
          setTimeout(() => {
            this.addClientSession(instrument);
          }, 30000);
        }
      });
      //
      this.clientSessions.set(instrument.id, client);
      return {
        type: 'up',
        id: instrument.id,
        target: 'client',
        status: 200,
        message: 'instrument tcp client session started',
      };
    }
    return {
      type: 'up',
      id: instrument.id,
      target: 'client',
      status: 200,
      message: 'instrument tcp client session already exists',
    };
  }

  async removeClientSession(id: string) {
    try {
      const { client } = this.clientSessions.get(id);
      client.destroy();
      this.serverSessions.delete(id);
    } catch (error) {
      //
    }

    this.instrumentGateway.eventEmit('session', {
      id,
      target: 'client',
      message: 'disconnected',
      connected: false,
    });
  }
}
