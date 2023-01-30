import { Injectable, Logger } from '@nestjs/common';
import hl7parser from 'hl7parser';
import moment from 'moment';
import { InstrumentConnectionService } from 'src/resources/instrument/instrument.connection';

@Injectable()
export class InstrumentParserService {
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

  constructor() {
    //
  }

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
      'MSH|^~\\&|VLSM|VLSM|VLSM|VLSM|' +
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

    // Sending HL7 ACK
    return ack;
  }

  // clientType: client/session
  public handleSocketData(
    data: any,
    instrument,
    clientType = 'client',
    clientSocket,
  ) {
    let strData = data[instrument.instrumentId][clientType] ?? '';

    if (instrument.protocol === 'hl7') {
      const hl7Text = this.hex2ascii(data.toString('hex'));
      strData += hl7Text;

      // If there is a File Separator or 1C or ASCII 28 character,
      // it means the stream has ended and we can proceed with saving this data
      if (strData.includes('\x1c')) {
        // Let us store this Raw Data before we process it
        // Received File Separator Character. Ready to process HL7 data

        const rData: any = {};
        rData.data = strData;
        rData.machine = instrument.name;

        // add raw data to database here
        // resultsOrderService.createRawData(rData)

        strData += strData.replace(/[\x0b\x1c]/g, '');
        strData += strData.trim();
        strData += strData.replace(/[\r\n\x0B\x0C\u0085\u2028\u2029]+/gm, '\r');

        if (instrument.name === 'abbott-alinity-m') {
          this.processHL7DataAlinity(strData, clientSocket);
        } else if (instrument.name === 'roche-cobas-6800') {
          this.processHL7DataRoche68008800(strData, clientSocket);
        } else {
          this.processHL7Data(strData, clientSocket);
        }

        data[instrument.instrumentId][clientType] = '';
      }
    } else if (instrument.protocol === 'astm-elecsys') {
      const d = data.toString('hex');

      if (d === '04') {
        clientSocket.write(this.ACK);
        // Received EOT. Ready to Process
        // Let us store this Raw Data before we process it
        const rData: any = {};
        rData.data = strData;
        rData.machine = instrument.name;
        // add raw data to database here
        // resultsOrderService.createRawData(rData)

        this.processASTMElecsysData(strData);

        data[instrument.instrumentId][clientType] = '';
      } else if (d === '21') {
        clientSocket.write(this.ACK);
        // NAK Received'
      } else {
        let text = this.hex2ascii(d);
        if (text.match(/^\d*H/)) {
          text = '##START##' + text;
        }
        strData += text;

        // 'Receiving....
        clientSocket.write(this.ACK);
      }
    } else if (instrument.protocol === 'astm-concatenated') {
      // Processing ASTM Concatenated'

      const d = data.toString('hex');

      if (d === '04') {
        clientSocket.write(this.ACK);

        // 'Received EOT. Ready to Process'

        // Let us store this Raw Data before we process it
        const rData: any = {};
        rData.data = strData;
        rData.machine = instrument.name;
        // add raw data to database here
        // resultsOrderService.createRawData(rData)

        this.processASTMConcatenatedData(strData);
        data[instrument.instrumentId][clientType] = '';
      } else if (d === '21') {
        clientSocket.write(this.ACK);
        // NAK Received
      } else {
        let text = this.hex2ascii(d);
        if (text.match(/^\d*H/)) {
          text = '##START##' + text;
        }
        strData += text;
        clientSocket.write(this.ACK);
      }
    }
  }

  processHL7DataAlinity(rawText, clientSocket) {
    const message = hl7parser.create(rawText);
    const msgID = message.get('MSH.10').toString();
    clientSocket.write(this.hl7ACK(msgID));
    const obx = message.get('OBX').toArray();
    const spm = message.get('SPM');
    const sampleNumber = 0;

    spm.forEach(function (singleSpm) {
      const singleObx = obx[0]; // there are twice as many OBX .. so we take the even number - 1 OBX for each SPM
      const resultOutcome = singleObx.get('OBX.5.1').toString();
      const order: any = {};
      order.raw_text = rawText;
      order.order_id = singleSpm.get('SPM.3').toString().replace('&ROCHE', '');
      order.test_id = singleSpm.get('SPM.3').toString().replace('&ROCHE', '');

      if (order.order_id === '') {
        //Let us use the Sample Container ID as the Order ID
        order.order_id = message.get('SAC.3').toString();
        order.test_id = message.get('SAC.3').toString();
      }

      order.test_type = 'HIVVL';

      if (resultOutcome === 'Titer') {
        order.test_unit = singleObx.get('OBX.6.1').toString();
        order.results = singleObx.get('OBX.5.1').toString();
      } else if (resultOutcome === '> Titer max') {
        order.test_unit = '';
        order.results = '>10000000';
      } else if (resultOutcome === 'Invalid') {
        order.test_unit = '';
        order.results = 'Invalid';
      } else if (resultOutcome === 'Failed') {
        order.test_unit = '';
        order.results = 'Failed';
      } else {
        order.test_unit = singleObx.get('OBX.6.1').toString();
        if (!order.test_unit) {
          order.test_unit = singleObx.get('OBX.6.2').toString();
        }
        if (!order.test_unit) {
          order.test_unit = singleObx.get('OBX.6').toString();
        }
        order.results = resultOutcome;
      }

      order.tested_by = singleObx.get('OBX.16').toString();
      order.result_status = 1;
      order.lims_sync_status = 0;
      order.analysed_date_time = this.formatRawDate(
        singleObx.get('OBX.19').toString(),
      );
      //order.specimen_date_time = this.formatRawDate(message.get('OBX').get(0).get('OBX.19').toString());
      order.authorised_date_time = this.formatRawDate(
        singleObx.get('OBX.19').toString(),
      );
      order.result_accepted_date_time = this.formatRawDate(
        singleObx.get('OBX.19').toString(),
      );
      order.test_location = this.appSettings.labName;
      order.machine_used = this.appSettings.analyzerMachineName;

      if (order.results) {
        this.dbService.addOrderTest(
          order,
          (res) => {
            this.logger(
              'success',
              'Result Successfully Added : ' + order.test_id,
            );
          },
          (err) => {
            this.logger(
              'error',
              'Failed to add result : ' +
                order.test_id +
                ' ' +
                JSON.stringify(err),
            );
          },
        );
      } else {
        this.logger('error', 'Unable to store data into the database');
      }

      // order.order_id = r.sampleID;
      // order.test_id = r.sampleID;
      // order.test_type = r.testName;
      // order.test_unit = r.unit;
      // //order.createdDate = '';
      // order.results = r.result;
      // order.tested_by = r.operator;
      // order.result_status = 1;
      // order.analysed_date_time = r.timestamp;
      // order.specimen_date_time = r.specimenDate;
      // order.authorised_date_time = r.timestamp;
      // order.result_accepted_date_time = r.timestamp;
      // order.test_location = this.appSettings.labName;
      // order.machine_used = this.appSettings.analyzerMachineName;
    });
  }

  processHL7Data(rawText, clientSocket) {
    const message = hl7parser.create(rawText);
    const msgID = message.get('MSH.10').toString();
    clientSocket.write(this.hl7ACK(msgID));
    // let result = null;
    //console.log(message.get('OBX'));

    const obx = message.get('OBX').toArray();

    //obx.forEach(function (singleObx) {
    //  console.log(singleObx);
    //});

    const spm = message.get('SPM');
    let sampleNumber = 0;

    //console.log(obx[1]);
    spm.forEach(function (singleSpm) {
      sampleNumber = singleSpm.get(1).toInteger();
      if (isNaN(sampleNumber)) {
        sampleNumber = 1;
      }
      const singleObx = obx[sampleNumber * 2 - 1]; // there are twice as many OBX .. so we take the even number - 1 OBX for each SPM

      //console.log(singleObx.get('OBX.19').toString());

      const resultOutcome = singleObx.get('OBX.5.1').toString();

      const order: any = {};
      order.raw_text = rawText;
      order.order_id = singleSpm.get('SPM.2').toString().replace('&ROCHE', '');
      order.test_id = singleSpm.get('SPM.2').toString().replace('&ROCHE', '');

      if (order.order_id === '') {
        // const sac = message.get('SAC').toArray();
        // const singleSAC = sac[0];
        //Let us use the Sample Container ID as the Order ID
        order.order_id = message.get('SAC.3').toString();
        order.test_id = message.get('SAC.3').toString();
      }

      order.test_type = 'HIVVL';

      if (resultOutcome == 'Titer') {
        order.test_unit = singleObx.get('OBX.6.1').toString();
        order.results = singleObx.get('OBX.5.1').toString();
      } else if (resultOutcome == '<20') {
        order.test_unit = '';
        order.results = 'Target Not Detected';
      } else if (resultOutcome == '> Titer max') {
        order.test_unit = '';
        order.results = '>10000000';
      } else if (resultOutcome == 'Target Not Detected') {
        order.test_unit = '';
        order.results = 'Target Not Detected';
      } else if (resultOutcome == 'Invalid') {
        order.test_unit = '';
        order.results = 'Invalid';
      } else if (resultOutcome == 'Failed') {
        order.test_unit = '';
        order.results = 'Failed';
      } else {
        order.test_unit = singleObx.get('OBX.6.1').toString();
        order.results = resultOutcome;
      }

      order.tested_by = singleObx.get('OBX.16').toString();
      order.result_status = 1;
      order.lims_sync_status = 0;
      order.analysed_date_time = this.formatRawDate(
        singleObx.get('OBX.19').toString(),
      );
      //order.specimen_date_time = this.formatRawDate(message.get('OBX').get(0).get('OBX.19').toString());
      order.authorised_date_time = this.formatRawDate(
        singleObx.get('OBX.19').toString(),
      );
      order.result_accepted_date_time = this.formatRawDate(
        singleObx.get('OBX.19').toString(),
      );
      order.test_location = this.appSettings.labName;
      order.machine_used = this.appSettings.analyzerMachineName;

      if (order.results) {
        this.dbService.addOrderTest(
          order,
          (res) => {
            this.logger(
              'success',
              'Result Successfully Added : ' + order.test_id,
            );
          },
          (err) => {
            this.logger(
              'error',
              'Failed to add result : ' +
                order.test_id +
                ' ' +
                JSON.stringify(err),
            );
          },
        );
      } else {
        this.logger('error', 'Unable to store data into the database');
      }

      // order.order_id = r.sampleID;
      // order.test_id = r.sampleID;
      // order.test_type = r.testName;
      // order.test_unit = r.unit;
      // //order.createdDate = '';
      // order.results = r.result;
      // order.tested_by = r.operator;
      // order.result_status = 1;
      // order.analysed_date_time = r.timestamp;
      // order.specimen_date_time = r.specimenDate;
      // order.authorised_date_time = r.timestamp;
      // order.result_accepted_date_time = r.timestamp;
      // order.test_location = this.appSettings.labName;
      // order.machine_used = this.appSettings.analyzerMachineName;
    });
  }
  processHL7DataRoche68008800(rawText, clientSocket) {
    const message = hl7parser.create(rawText);
    const msgID = message.get('MSH.10').toString();
    clientSocket.write(this.hl7ACK(msgID));
    // let result = null;
    //console.log(message.get('OBX'));

    const obxArray = message.get('OBX').toArray();

    const spm = message.get('SPM');
    const sampleNumber = 0;

    //console.log(obx[1]);
    spm.forEach(function (singleSpm) {
      let resultOutcome = '';
      let singleObx = null;
      obxArray.forEach(function (obx) {
        if (obx.get('OBX.4').toString() === '1/2') {
          resultOutcome = obx.get('OBX.5.1').toString();
          singleObx = obx;
          if (resultOutcome === 'Titer') {
            singleObx = obx = obxArray[0];
            resultOutcome = obx.get('OBX.5.1').toString();
          }
        }
      });

      const order: any = {};
      order.raw_text = rawText;
      order.order_id = singleSpm.get('SPM.2').toString().replace('&ROCHE', '');
      order.test_id = singleSpm.get('SPM.2').toString().replace('&ROCHE', '');

      if (order.order_id === '') {
        // const sac = message.get('SAC').toArray();
        // const singleSAC = sac[0];
        //Let us use the Sample Container ID as the Order ID
        order.order_id = message.get('SAC.3').toString();
        order.test_id = message.get('SAC.3').toString();
      }

      order.test_type = 'HIVVL';

      if (resultOutcome == 'Titer') {
        order.test_unit = singleObx.get('OBX.6.1').toString();
        order.results = singleObx.get('OBX.5.1').toString();
      } else if (resultOutcome == '<20') {
        order.test_unit = '';
        order.results = 'Target Not Detected';
      } else if (resultOutcome == '> Titer max') {
        order.test_unit = '';
        order.results = '>10000000';
      } else if (resultOutcome == 'Target Not Detected') {
        order.test_unit = '';
        order.results = 'Target Not Detected';
      } else if (resultOutcome == 'Invalid') {
        order.test_unit = '';
        order.results = 'Invalid';
      } else if (resultOutcome == 'Failed') {
        order.test_unit = '';
        order.results = 'Failed';
      } else {
        order.test_unit = singleObx.get('OBX.6.1').toString();
        order.results = resultOutcome;
      }

      order.tested_by = singleObx.get('OBX.16').toString();
      order.result_status = 1;
      order.lims_sync_status = 0;
      order.analysed_date_time = this.formatRawDate(
        singleObx.get('OBX.19').toString(),
      );
      //order.specimen_date_time = this.formatRawDate(message.get('OBX').get(0).get('OBX.19').toString());
      order.authorised_date_time = this.formatRawDate(
        singleObx.get('OBX.19').toString(),
      );
      order.result_accepted_date_time = this.formatRawDate(
        singleObx.get('OBX.19').toString(),
      );
      order.test_location = this.appSettings.labName;
      order.machine_used = this.appSettings.analyzerMachineName;

      if (order.results) {
        this.dbService.addOrderTest(
          order,
          (res) => {
            this.logger(
              'success',
              'Result Successfully Added : ' + order.test_id,
            );
          },
          (err) => {
            this.logger(
              'error',
              'Failed to add result : ' +
                order.test_id +
                ' ' +
                JSON.stringify(err),
            );
          },
        );
      } else {
        this.logger('error', 'Unable to store data into the database');
      }

      // order.order_id = r.sampleID;
      // order.test_id = r.sampleID;
      // order.test_type = r.testName;
      // order.test_unit = r.unit;
      // //order.createdDate = '';
      // order.results = r.result;
      // order.tested_by = r.operator;
      // order.result_status = 1;
      // order.analysed_date_time = r.timestamp;
      // order.specimen_date_time = r.specimenDate;
      // order.authorised_date_time = r.timestamp;
      // order.result_accepted_date_time = r.timestamp;
      // order.test_location = this.appSettings.labName;
      // order.machine_used = this.appSettings.analyzerMachineName;
    });
  }

  arrayKeyExists(key, search) {
    // eslint-disable-line camelcase
    //  discuss at: http://locutus.io/php/arrayKeyExists/
    // original by: Kevin van Zonneveld (http://kvz.io)
    // improved by: Felix Geisendoerfer (http://www.debuggable.com/felix)
    //   example 1: arrayKeyExists('kevin', {'kevin': 'van Zonneveld'})
    //   returns 1: true

    if (
      !search ||
      (search.constructor !== Array && search.constructor !== Object)
    ) {
      return false;
    }

    return key in search;
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

  processASTMElecsysData(astmData: string) {
    //this.logger('info', astmData);

    const fullDataArray = astmData.split('##START##');

    // this.logger('info', "AFTER SPLITTING USING ##START##");
    // this.logger('info', fullDataArray);

    fullDataArray.forEach(function (partData) {
      if (partData !== '' && partData !== undefined && partData !== null) {
        const data = partData.replace(/[\x05\x02\x03]/g, '');
        const astmArray = data.split(/\r?\n/);

        const dataArray = [];

        astmArray.forEach(function (element) {
          if (element !== '') {
            element = element.replace(/^\d*/, '');
            if (dataArray[element.substring(0, 1)] === undefined) {
              dataArray[element.substring(0, 1)] = element.split('|');
            } else {
              const arr = element.split('|');
              arr.shift();
              dataArray[element.substring(0, 1)] += arr;
            }
          }
        });

        //this.logger('info', dataArray);
        //this.logger('info',dataArray['R']);

        if (
          dataArray === null ||
          dataArray === undefined ||
          dataArray['R'] === undefined
        ) {
          this.logger('info', 'dataArray blank');
          return;
        }

        const order: any = {};

        try {
          if (
            this.arrayKeyExists('R', dataArray) &&
            typeof dataArray['R'] == 'string'
          ) {
            dataArray['R'] = dataArray['R'].split(',');
          }

          if (
            this.arrayKeyExists('O', dataArray) &&
            typeof dataArray['O'] == 'string'
          ) {
            dataArray['O'] = dataArray['O'].split(',');
          }

          if (
            this.arrayKeyExists('C', dataArray) &&
            typeof dataArray['C'] == 'string'
          ) {
            dataArray['C'] = dataArray['C'].split(',');
          }

          console.warn(dataArray['O']);
          console.warn(dataArray['R']);

          if (dataArray['O'] !== undefined && dataArray['O'] !== null) {
            order.order_id = dataArray['O'][2];
            order.test_id = dataArray['O'][1];
            if (dataArray['R'] !== undefined && dataArray['R'] !== null) {
              order.test_type = dataArray['R'][2]
                ? dataArray['R'][2].replace('^^^', '')
                : dataArray['R'][2];
              order.test_unit = dataArray['R'][4];
              order.results = dataArray['R'][3];
              order.tested_by = dataArray['R'][10];
              order.analysed_date_time = this.formatRawDate(dataArray['R'][12]);
              order.authorised_date_time = this.formatRawDate(
                dataArray['R'][12],
              );
              order.result_accepted_date_time = this.formatRawDate(
                dataArray['R'][12],
              );
            } else {
              order.test_type = '';
              order.test_unit = '';
              order.results = 'Failed';
              order.tested_by = '';
              order.analysed_date_time = '';
              order.authorised_date_time = '';
              order.result_accepted_date_time = '';
            }
            order.raw_text = partData;
            order.result_status = 1;
            order.lims_sync_status = 0;
            order.test_location = this.appSettings.labName;
            order.machine_used = this.appSettings.analyzerMachineName;

            if (order.order_id) {
              this.logger(
                'info',
                'Trying to add order :' + JSON.stringify(order),
              );
              this.dbService.addOrderTest(
                order,
                (res) => {
                  this.logger(
                    'success',
                    'Result Successfully Added : ' + order.order_id,
                  );
                },
                (err) => {
                  this.logger(
                    'error',
                    'Failed to add : ' + JSON.stringify(err),
                  );
                },
              );
            } else {
              this.logger(
                'error',
                'Could NOT add order :' + JSON.stringify(order),
              );
            }
          }
        } catch (error) {
          this.logger('error', error);
          console.error(error);
          return;
        }

        //if (dataArray == undefined || dataArray['0'] == undefined ||
        //      dataArray['O'][3] == undefined || dataArray['O'][3] == null ||
        //        dataArray['O'][3] == '') return;
        //if (dataArray == undefined || dataArray['R'] == undefined
        //        || dataArray['R'][2] == undefined || dataArray['R'][2] == null
        //        || dataArray['R'][2] == '') return;
      } else {
        this.logger(
          'error',
          'Could NOT add order :' + JSON.stringify(astmData),
        );
      }
    });
  }

  processASTMConcatenatedData(astmData: string) {
    //this.logger('info', astmData);

    astmData = astmData.replace(/[\x05]/g, '');
    astmData = astmData.replace(/\x02/g, '<STX>');
    astmData = astmData.replace(/\x03/g, '<ETX>');
    astmData = astmData.replace(/\x04/g, '<EOT>');
    astmData = astmData.replace(/\x17/g, '<ETB>');
    //astmData = astmData.replace(/\x5E/g, "::")

    astmData = astmData.replace(/\n/g, '<LF>');
    astmData = astmData.replace(/\r/g, '<CR>');

    //Let us remove the transmission blocks
    astmData = astmData
      .replace(/<ETB>\w{2}<CR><LF>/g, '')
      .replace(/<STX>/g, '');

    const fullDataArray = astmData.split('##START##');

    // this.logger('info', "AFTER SPLITTING USING ##START##");
    // this.logger('info', fullDataArray);

    fullDataArray.forEach(function (partData) {
      if (partData !== '' && partData !== undefined && partData !== null) {
        const astmArray = partData.split(/<CR>/);

        const dataArray = [];

        astmArray.forEach(function (element) {
          if (element !== '') {
            element = element.replace(/^\d*/, '');
            if (dataArray[element.substring(0, 1)] === undefined) {
              dataArray[element.substring(0, 1)] = element.split('|');
            } else {
              const arr = element.split('|');
              arr.shift();
              dataArray[element.substring(0, 1)] += arr;
            }
          }
        });

        //console.log("=== CHOTOA ===");
        //this.logger('info', dataArray);
        //this.logger('info',dataArray['R']);

        if (
          dataArray === null ||
          dataArray === undefined ||
          dataArray['R'] === undefined
        ) {
          this.logger('info', 'dataArray blank');
          return;
        }

        const order: any = {};

        try {
          if (
            this.arrayKeyExists('R', dataArray) &&
            typeof dataArray['R'] == 'string'
          ) {
            dataArray['R'] = dataArray['R'].split(',');
          }

          if (
            this.arrayKeyExists('O', dataArray) &&
            typeof dataArray['O'] == 'string'
          ) {
            dataArray['O'] = dataArray['O'].split(',');
          }

          if (
            this.arrayKeyExists('C', dataArray) &&
            typeof dataArray['C'] == 'string'
          ) {
            dataArray['C'] = dataArray['C'].split(',');
          }

          if (dataArray['O'] !== undefined && dataArray['O'] !== null) {
            order.order_id = dataArray['O'][2];
            order.test_id = dataArray['O'][1];
            if (dataArray['R'] !== undefined && dataArray['R'] !== null) {
              order.test_type = dataArray['R'][2]
                ? dataArray['R'][2].replace('^^^', '')
                : dataArray['R'][2];
              order.test_unit = dataArray['R'][4];
              order.results = dataArray['R'][3];
              order.tested_by = dataArray['R'][10];
              order.analysed_date_time = this.formatRawDate(dataArray['R'][12]);
              order.authorised_date_time = this.formatRawDate(
                dataArray['R'][12],
              );
              order.result_accepted_date_time = this.formatRawDate(
                dataArray['R'][12],
              );
            } else {
              order.test_type = '';
              order.test_unit = '';
              order.results = 'Failed';
              order.tested_by = '';
              order.analysed_date_time = '';
              order.authorised_date_time = '';
              order.result_accepted_date_time = '';
            }
            order.raw_text = partData;
            order.result_status = 1;
            order.lims_sync_status = 0;
            order.test_location = this.appSettings.labName;
            order.machine_used = this.appSettings.analyzerMachineName;

            if (order.order_id) {
              this.logger(
                'info',
                'Trying to add order :' + JSON.stringify(order),
              );
              this.dbService.addOrderTest(
                order,
                (res) => {
                  this.logger(
                    'success',
                    'Result Successfully Added : ' + order.order_id,
                  );
                },
                (err) => {
                  this.logger(
                    'error',
                    'Failed to add : ' + JSON.stringify(err),
                  );
                },
              );
            } else {
              this.logger(
                'error',
                'Could NOT add order :' + JSON.stringify(order),
              );
            }
          }
        } catch (error) {
          this.logger('error', error);
          console.error(error);
          return;
        }

        //if (dataArray == undefined || dataArray['0'] == undefined ||
        //      dataArray['O'][3] == undefined || dataArray['O'][3] == null ||
        //        dataArray['O'][3] == '') return;
        //if (dataArray == undefined || dataArray['R'] == undefined
        //        || dataArray['R'][2] == undefined || dataArray['R'][2] == null
        //        || dataArray['R'][2] == '') return;
      }
    });
  }

  fetchLastOrders() {
    // this.dbService.fetchLastOrders(
    //   (res) => {
    //     res = [res]; // converting it into an array
    //     this.lastOrdersSubject.next(res);
    //   },
    //   (err) => {
    //     this.logger('error', 'Failed to fetch data ' + JSON.stringify(err));
    //   },
    // );
  }

  fetchRecentLogs() {
    // this.dbService.fetchRecentLogs(
    //   (res) => {
    //     res.forEach(function (r) {
    //       this.logtext.push(r.log);
    //       this.liveLogSubject.next(this.logtext);
    //     });
    //   },
    //   (err) => {
    //     // Failed to fetch data
    //   },
    // );
  }

  fetchLastSyncTimes(callback): any {
    //   this.dbService.fetchLastSyncTimes(
    //     (res) => {
    //       // data.lastLimsSync = (res[0].lastLimsSync);
    //       // data.lastResultReceived = (res[0].lastResultReceived);
    //       // return data;
    //       callback(res[0]);
    //     },
    //     (err) => {
    //       // Failed to fetch data
    //     },
    //   );
  }
}
