import { IMessageParser } from './parser.interface';
import hl7parser from 'hl7parser';

const RocheASTMPlusParser_MESSAGE_EXAMPLE = `
`;
export class RocheASTMPlusParser implements IMessageParser {
  transmission = '';
  instrument = null;
  field_delimiter: string;
  repeat_delimiter: string;
  component_delimiter: string;
  escape_delimiter: string;

  constructor(transmission: string, instrument) {
    this.transmission = transmission;
    this.instrument = instrument;
  }

  private get_delimiter = (header_record: string, index: number) =>
    header_record[index];

  private get_field = (record: string, index: number): string => {
    const fields = record.split(this.field_delimiter);
    return fields[index];
  };

  private get_component = (field: string, index: number) => {
    const comps = field.split(this.component_delimiter);
    return comps[index];
  };

  private get = (
    record: string,
    field_index: number,
    component_index: number | undefined = undefined,
  ) => {
    const field = this.get_field(record, field_index);
    if (!component_index) return field;
    return this.get_component(field, component_index);
  };

  private get_record_for = (dataLines: string[], key: string): string[] =>
    dataLines.filter((dl) => dl.indexOf(key) === 0);

  private header_data = (record: string) => {
    const sender_info = this.get_field(record, 4);
    const receiver_info = this.get_field(record, 9);

    return {
      RecordTypeId: this.get_field(record, 0),
      FieldDelimiter: this.field_delimiter,
      RepeatDelimiter: this.repeat_delimiter,
      ComponentDelimiter: this.component_delimiter,
      EscapeDelimiter: this.escape_delimiter,
      SenderName: this.get_component(sender_info, 0),
      Manufacturer: this.get_component(sender_info, 1),
      InstrumentType: this.get_component(sender_info, 2),
      SoftwareVersion: this.get_component(sender_info, 3),
      ProtocolVersion: this.get_component(sender_info, 4),
      SerialNumber: this.get_component(sender_info, 5),
      SenderNetworkAddress: this.get_component(sender_info, 6),
      ReceiverName: this.get_component(receiver_info, 0),
      ReceiverNetworkAddress: this.get_component(receiver_info, 1),
      ProcessingID: this.get_field(record, 11),
      VersionNo: this.get_field(record, 12),
    };
  };

  private patient_data = (record: string) => {
    return {
      RecordTypeId: this.get_field(record, 0),
      SequenceNumber: this.get_field(record, 1),
      PracticePatientID: this.get_field(record, 2),
      LabPatientID: this.get_field(record, 3),
      PatientIDNo3: this.get_field(record, 4),
    };
  };

  private order_data = (record: string) => {
    const order_comp = this.get_field(record, 3);
    const test_comp = this.get_field(record, 4);
    const volume = this.get_field(record, 9);
    return {
      RecordTypeId: this.get_field(record, 0),
      SequenceNumber: this.get_field(record, 1),
      SpecimenID: this.get_field(record, 2),
      OrderID: this.get_component(order_comp, 0),
      RackCarrierID: this.get_component(order_comp, 1),
      PositionOnRackCarrier: this.get_component(order_comp, 2),
      TrayOrLocationID: this.get_component(order_comp, 3),
      RackCarrierType: this.get_component(order_comp, 4),
      TubeContainerType: this.get_component(order_comp, 5),
      TestID: this.get_component(test_comp, 3),
      TreatmentType: this.get_component(test_comp, 4),
      'Pre-TreatmentType': this.get_component(test_comp, 5),
      ResultEvaluationType: this.get_component(test_comp, 6),
      Priority: this.get_field(record, 5),
      RequestedDateTime: this.get_field(record, 6),
      CollectionDateTime: this.get_field(record, 7),
      CollectionEndDateTime: this.get_field(record, 8),
      'CollectionVolume.Value': this.get_component(volume, 0),
      'CollectionVolume.Unit': this.get_component(volume, 1),
      CollectorID: this.get_field(record, 10),
      ActionCode: this.get_field(record, 11),
      DangerCode: this.get_field(record, 12),
      ClinicalInformation: this.get_field(record, 13),
      ReceivedDateTime: this.get_field(record, 14),
    };
  };

  private result_meta = (record: string) => {
    const test_comp = this.get_field(record, 2);
    const result_comp = this.get_field(record, 3);
    const limit_comp = this.get_field(record, 5);
    return {
      RecordTypeId: this.get_field(record, 0),
      SequenceNumber: this.get_field(record, 1),
      TestID: this.get_component(test_comp, 3),
      TreatmentType: this.get_component(test_comp, 4),
      'Pre-TreatmentType': this.get_component(test_comp, 5),
      ResultEvaluationType: this.get_component(test_comp, 6),
      DataMeasurementResultScalar: this.get_component(result_comp, 0),
      DataMeasurementResultValUnit: this.get_field(record, 4),
      DataCutOffIndex: this.get_component(result_comp, 1),
      LowerLimit: this.get_component(limit_comp, 0),
      UpperLimit: this.get_component(limit_comp, 1),
      LimitName: this.get_component(limit_comp, 2),
      ResultAbnormalFlag: this.get_field(record, 6),
      NatureOfAbnormality: this.get_field(record, 7),
      ResultStatus: this.get_field(record, 8),
      DateChangeInstrumentValue: this.get_field(record, 9),
      Operator: this.get_field(record, 10),
      DateTimeTestStarted: this.get_field(record, 11),
      DateTimeTestCompleted: this.get_field(record, 12),
      InstrumentIdentification: this.get_field(record, 13),
    };
  };

  private result_data = (records: string[]) => {
    const result_metas = records.map((r) => this.result_meta(r));
    return result_metas[0];
  };

  public is_supported = (): boolean => {
    const transmissionLines: string[] = this.transmission
      .split('H|')
      .filter((st) => st != '')
      .map((st) => 'H|' + st);

    const datumLine = transmissionLines[0];
    const lineList = datumLine.split('\n');
    const header_record = this.get_record_for(lineList, 'H')[0];
    this.field_delimiter = this.get_delimiter(header_record, 1);
    this.repeat_delimiter = this.get_delimiter(header_record, 2);
    this.component_delimiter = this.get_delimiter(header_record, 3);
    this.escape_delimiter = this.get_delimiter(header_record, 4);
    const header = this.header_data(header_record);
    return (
      header['ProtocolVersion'] === 'Roche ASTM+' &&
      this.instrument.protocol === 'astm'
    );
  };

  public run() {
    const final: any[] = [];

    const transmissionLines: string[] = this.transmission
      .split('H|')
      .filter((st) => st != '')
      .map((st) => 'H|' + st);

    for (const datumLine of transmissionLines) {
      if (datumLine.length < 10) {
        // log Transmission String Too Small
        continue;
      }

      const lineList = datumLine.split('\n');

      const header_record = this.get_record_for(lineList, 'H')[0];
      this.field_delimiter = this.get_delimiter(header_record, 1);
      this.repeat_delimiter = this.get_delimiter(header_record, 2);
      this.component_delimiter = this.get_delimiter(header_record, 3);
      this.escape_delimiter = this.get_delimiter(header_record, 4);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const header = this.header_data(header_record);

      const order_record = this.get_record_for(lineList, 'O')[0];
      const order = this.order_data(order_record);
      const results_record = this.get_record_for(lineList, 'R');
      if (results_record.length === 0) {
        continue;
      }
      const results = this.result_data(results_record);

      // as CreateResultOrderDto
      const _read = () => {
        return {
          order_id: order['SpecimenID'],
          test_id: order['SpecimenID'],
          keyword: results['TestID'],
          result:
            results['DataMeasurementResultScalar'] === 'Not detected'
              ? 'Target not detected'
              : 'Not detected',
          result_date: results['DateTimeTestCompleted'],
          unit: results['Units'],
          comment: '',
          is_sync_allowed: true,
          synced: false,
          sync_date: '',
          sync_comment: '',
          result_raw: datumLine,
          instrument: this.instrument,
        };
      };

      final.push(_read());
    }

    return final;
  }
}

const HL7Roche68008800_MESSAGE_EXAMPLE = `
MSH|^~\&|COBAS6800/8800||LIS||20230123104355||OUL^R22|13968052-baa9-474c-91bb-f7cf19d988fe|P|2.5||||||ASCII
SPM||BP23-04444||PLAS^plasma^HL70487|||||||P||||||||||||||||
SAC|||||||||||||||||||||500|||uL^^UCUM
OBR|1|||70241-5^HIV^LN|||||||A
OBX|1|ST|HIV^HIV^99ROC||ValueNotSet|||BT|||F|||||Lyna||C6800/8800^Roche^^~Unknown^Roche^^~ID_000000000012076380^IM300-002765^^|20230120144614|||||||||386_neg^^99ROC~385_pos^^99ROC
TCD|70241-5^HIV^LN|^1^:^0
OBX|2|NA|HIV^HIV^99ROC^S_OTHER^Other Supplemental^IHELAW||41.47^^37.53||||||F|||||Lyna||C6800/8800^Roche^^~Unknown^Roche^^~ID_000000000012076380^IM300-002765^^|20230120144614|||||||||386_neg^^99ROC~385_pos^^99ROC
OBX|3|ST|70241-5^HIV^LN|1/1|ValueNotSet|||RR|||F|||||Lyna||C6800/8800^Roche^^~Unknown^Roche^^~ID_000000000012076380^IM300-002765^^|20230120144614|||||||||386_neg^^99ROC~385_pos^^99ROC
OBX|4|ST|70241-5^HIV^LN|1/2|< Titer min|||""|||F|||||Lyna||C6800/8800^Roche^^~Unknown^Roche^^~ID_000000000012076380^IM300-002765^^|20230120144614|||||||||386_neg^^99ROC~385_pos^^99ROC
TCD|70241-5^HIV^LN|^1^:^0
`;
export class Roche68008800HL7Parser implements IMessageParser {
  transmission = '';
  instrument = null;

  constructor(transmission: string, instrument) {
    this.transmission = transmission;
    this.instrument = instrument;
  }

  public is_supported = (): boolean => {
    const message = hl7parser.create(this.transmission);
    return (
      message.get('MSH.3').toString() === 'COBAS6800/8800' &&
      this.instrument.protocol === 'hl7'
    );
  };

  public run() {
    const message = hl7parser.create(this.transmission);

    const obxArray = message.get('OBX').toArray();

    const spm = message.get('SPM');

    const final: any[] = [];

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
      order.raw_text = this.transmission;
      order.order_id = singleSpm.get('SPM.2').toString().replace('&ROCHE', '');
      order.test_id = singleSpm.get('SPM.2').toString().replace('&ROCHE', '');

      if (order.order_id === '') {
        // Let us use the Sample Container ID as the Order ID
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

const RocheElecsysASTM_MESSAGE_EXAMPLE = ``;
export class RocheElecsysASTMParser implements IMessageParser {
  transmission = '';
  instrument = null;

  constructor(transmission: string, instrument) {
    this.transmission = transmission;
    this.instrument = instrument;
  }

  public is_supported = (): boolean => this.instrument.protocol === 'hl7';

  public run() {
    const fullDataArray = this.transmission.split('##START##');

    const final: any[] = [];

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

            if (order.results) {
              final.push(order);
            }
          }
        } catch (e) {}
      }
    });
    return final;
  }
}
