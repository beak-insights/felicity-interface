export interface IInstrument {
    id?: string;
    name: string;
    code?: string;
    protocol?: string;
    isClient?: boolean;
    port?: number;
    host?: string;
    baudRate?: number;
    path?: string;
    connecting?: boolean;
    connected?: boolean;
    message?: string;
    autoReconnect?: boolean;
    connectionType?: string;
  }