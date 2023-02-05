import { IMessageParser } from './parser.interface';
import hl7parser from 'hl7parser';

const GenericHL7_MESSAGE_EXAMPLE = ``;
export class GenericHL7Parser implements IMessageParser {
  transmission = '';
  instrument = null;

  constructor(transmission: string, instrument) {
    this.transmission = transmission;
    this.instrument = instrument;
  }

  public is_supported = (): boolean => this.instrument.protocol === 'hl7';

  public run() {
    const message = hl7parser.create(this.transmission);

    const obx = message.get('OBX').toArray();
    const spm = message.get('SPM');
    let sampleNumber = 0;

    const final: any[] = [];

    spm.forEach(function (singleSpm) {
      sampleNumber = singleSpm.get(1).toInteger();
      if (isNaN(sampleNumber)) {
        sampleNumber = 1;
      }
      const singleObx = obx[sampleNumber * 2 - 1]; // there are twice as many OBX .. so we take the even number - 1 OBX for each SPM

      //console.log(singleObx.get('OBX.19').toString());

      const resultOutcome = singleObx.get('OBX.5.1').toString();

      const order: any = {};
      order.raw_text = this.transmission;
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
        final.push(order);
      }
    });

    return final;
  }
}

const ConcatenatedASTM_MESSAGE_EXAMPLE = ``;
export class ConcatenatedASTMParser implements IMessageParser {
  transmission = '';
  instrument = null;

  constructor(transmission: string, instrument) {
    this.transmission = transmission;
    this.instrument = instrument;
  }

  public is_supported = (): boolean => this.instrument.protocol === 'hl7';

  public run() {
    const final: any[] = [];

    this.transmission = this.transmission
      .replace(/[\x05]/g, '')
      .replace(/\x02/g, '<STX>')
      .replace(/\x03/g, '<ETX>')
      .replace(/\x04/g, '<EOT>')
      .replace(/\x17/g, '<ETB>')
      .replace(/\n/g, '<LF>')
      .replace(/\r/g, '<CR>')
      .replace(/<ETB>\w{2}<CR><LF>/g, '')
      .replace(/<STX>/g, '');

    const fullDataArray = this.transmission.split('##START##');

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

        console.log('something 1');

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
              final.push(order);
            }
          }
        } catch (error) {
          return;
        }
      }
    });

    return final;
  }
}
