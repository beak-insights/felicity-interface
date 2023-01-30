import {
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  namespace: 'instrument',
  cors: {
    origin: '*',
  },
})
export class InstrumentGateway implements OnGatewayInit {
  @WebSocketServer()
  server: Server;

  afterInit(server: Server) {
    //
  }

  @SubscribeMessage('message')
  handleMessage(client: any, payload: any): string {
    console.log(payload);
    return 'Hello world!';
  }

  gateway() {
    return this.server;
  }

  eventEmit(event: string, payload: any) {
    return this.server.emit(event, payload);
  }
}
