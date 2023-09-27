/* eslint-disable @typescript-eslint/no-unused-vars */
import { Inject, Injectable, forwardRef } from '@nestjs/common';
import moment from 'moment';
import { InstrumentConnectionService } from 'src/resources/instrument/instrument.connection';
import { AllInclusiveParser } from './parsers';
import { ResultOrderService } from '../result-order/result-order.service';

@Injectable()
export class InstrumentHandlerService {
  data = {};
  protected ACK = Buffer.from('06', 'hex');
  protected ENQ = Buffer.from('05', 'hex');
  protected SOH = Buffer.from('01', 'hex');
  protected STX = Buffer.from('02', 'hex');
  protected ETX = Buffer.from('03', 'hex');
  protected EOT = Buffer.from('04', 'hex');
  protected CR = Buffer.from('13', 'hex');
  protected FS = Buffer.from('25', 'hex');
  protected LF = Buffer.from('10', 'hex');
  protected NAK = Buffer.from('21', 'hex');

  constructor(
    @Inject(forwardRef(() => InstrumentConnectionService))
    private instrumentConnectionService: InstrumentConnectionService,
    private parsers: AllInclusiveParser,
    private readonly resultOrderService: ResultOrderService,
  ) {}

  hex2ascii(hexx) {
    const hex = hexx.toString(); // force conversion
    let str = '';
    for (let i = 0; i < hex.length; i += 2) {
      str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    }
    return str;
  }

  hl7ACK(messageID) {
    if (!messageID || messageID === '') {
      messageID = Math.random();
    }

    const date = moment(new Date()).format('YYYYMMDDHHmmss');

    let ack =
      String.fromCharCode(11) +
      'MSH|^~\\&|FELICITY|FELICITY|FELICITY|FELICITY|' +
      date +
      '||ACK^R22^ACK|' +
      self.crypto.randomUUID() +
      '|P|2.5.1||||||UNICODE UTF-8' +
      String.fromCharCode(13);

    ack +=
      'MSA|AA|' +
      messageID +
      String.fromCharCode(13) +
      String.fromCharCode(28) +
      String.fromCharCode(13);

    return ack;
  }
 
  public socketReader(data: any, instrument, clientSocket) {
    let instance = null;
    if (instrument.isClient) {
      instance = this.instrumentConnectionService.getClientSession(
        instrument.id,
      );
    } else {
      instance = this.instrumentConnectionService.getServerSession(
        instrument.id,
      );
    }

    let strData = instance['statements']; // or statement

    console.log('instrument.protocol: ', instrument.protocol);
    if (instrument.protocol === 'hl7') {
      const hl7Text = this.hex2ascii(data.toString('hex'));

      strData += hl7Text;
      //

      // if stream has ended
      if (strData.includes('\x1c')) {
        strData = strData
          .replace(/[\x0b\x1c]/g, '')
          .trim()
          .replace(/[\r\n\x0B\x0C\u0085\u2028\u2029]+/gm, '\r');

        // send ack here
        const msgID = strData
          .split('\r') // .split('\n')
          .filter((m) => m.substring(0, 3).includes('MSH'))[0]
          .split('|')[9];
        clientSocket.write(this.hl7ACK(msgID));

        // then parse
        const final = this.parsers.parse(strData, instrument);

        if (final.length > 0) {
          this.resultOrderService.createAll(final);
        }

        strData = '';
      }
    }

    if (instrument.protocol === 'astm') {
      const d = data.toString('hex');

      if (d === '04') {
        clientSocket.write(this.ACK);

        const final = this.parsers.parse(strData, instrument);
        if (final.length > 0) {
          this.resultOrderService.createAll(final);
        }

        strData = '';
      } else if (d === '21') {
        clientSocket.write(this.ACK);
      } else {
        let text = this.hex2ascii(d);
        if (text.match(/^\d*H/)) {
          text = '##START##' + text;
        }
        strData += text;

        // 'Receiving....
        clientSocket.write(this.ACK);
      }
    }

    this.instrumentConnectionService.updateSerialSession(instrument.id, {
      ...instance,
      statement: strData,
    });
  }

  public serialReader(data: any, instrument, sPort) {
    const instance = this.instrumentConnectionService.getSerialSession(
      instrument.id,
    );

    const ACK_BUFFER = Buffer.from([6]);
    const ENQ = 5;
    const STX = 2;
    const ETX = 3;
    const LF = 10;
    const CR = 13;
    const EOT = 4;

    const str = data.toString('ascii');

    if (str.length === 0) return;

    const __summarizeTransmission = () => {
      const _instance = this.instrumentConnectionService.getSerialSession(
        instrument.id,
      );
      let text = '';
      for (const statement of _instance['transmission']) {
        let dataMessage = statement.dataMessage;
        if (dataMessage.length > 0) {
          dataMessage = dataMessage.substr(1, dataMessage.length);
        }
        text += dataMessage + '\n';
      }
      return text;
    };

    if (str.charCodeAt(0) === ENQ) {
      sPort.write(ACK_BUFFER);
    } else if (str.charCodeAt(0) === EOT) {
      const stringData: string = __summarizeTransmission();
      const final = this.parsers.parse(stringData, instrument);

      if (final.length > 0) {
        this.resultOrderService.createAll(final);
      }

      instance['transmission'] = [];
      this.instrumentConnectionService.updateSerialSession(instrument.id, {
        ...instance,
        transmission: [],
      });
    } else {
      const instance = this.instrumentConnectionService.getSerialSession(
        instrument.id,
      );
      const __transmission = instance['transmission'];
      let __statement = instance['statement'];

      for (const char of str.split('')) {
        if (char.charCodeAt(0) === STX) {
          __statement = {
            ...__statement,
            hasStarted: true,
            hasEnded: false,
            dataMessage: '',
            checksum: '',
          };
        } else if (char.charCodeAt(0) === ETX) {
          if (!__statement['hasStarted']) {
            console.log('statement ended before it was started.');
            return;
          }
          __statement['hasEnded'] = true;
        } else if (char.charCodeAt(0) === LF) {
          if (!__statement['hasStarted']) {
            console.log('LF before statement was started.');
            return;
          }
          if (!__statement['hasEnded']) {
            console.log('LF before statement was ended.');
            return;
          }
          __transmission.push(__statement);
          sPort.write(ACK_BUFFER);
        } else {
          if (!__statement['hasStarted']) {
            console.log(
              `Unkown character received before statement was started, ${char}, ${char.charCodeAt()}`,
            );
            return;
          }
          if (char.charCodeAt(0) !== CR) {
            if (!__statement['hasEnded']) {
              __statement['dataMessage'] += char;
            } else {
              __statement['checksum'] += char;
            }
          }
        }
      }
      // end for
      this.instrumentConnectionService.updateSerialSession(instrument.id, {
        ...instance,
        transmission: __transmission,
        statement: __statement,
      });
    }
  }

  formatRawDate(rawDate) {
    if (
      rawDate === false ||
      rawDate === null ||
      rawDate === '' ||
      rawDate === undefined ||
      rawDate.length === 0
    ) {
      return null;
    }

    const len = rawDate.length;
    const year = rawDate.substring(0, 4);
    const month = rawDate.substring(4, 6);
    const day = rawDate.substring(6, 8);
    let d = year + '-' + month + '-' + day;
    if (len > 9) {
      const h = rawDate.substring(8, 10);
      const m = rawDate.substring(10, 12);
      let s = '00';
      if (len > 11) {
        s = rawDate.substring(12, 14);
      }
      d += ' ' + h + ':' + m + ':' + s;
    }
    return d;
  }
}
