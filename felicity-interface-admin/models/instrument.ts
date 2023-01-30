export interface IInstrument {
    id?: string;
    name: string;
    code?: string;
    protocol?: string;
    client?: boolean;
    clientPort?: number;
    clientHost?: string;
    server?: boolean;
    serverPort?: number;
    autoReconnect?: boolean;
    connectionType?: string;
  }