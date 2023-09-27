import { BaseASTMParser } from './base';
import { IMessageParser } from './parser.interface';
import hl7parser from 'hl7parser';
import { formatRawDate } from './util';

const abbott = `
H|\^&|||m2000^8.1.9.0^275022112^H1P1O1R1C1L1|||||||P|1|20190903162134
P|1
O|1|DBS19-002994|DBS19-002994^WS19-2459^D1|^^^HIV1mlDBS^HIV1.0mlDBS|||||||||||||||||||||F
R|1|^^^HIV1mlDBS^HIV1.0mlDBS^489932^11790271^^F|< 839|Copies / mL||||R||naralabs^naralabs||20190902191654|275022112
R|2|^^^HIV1mlDBS^HIV1.0mlDBS^489932^11790271^^I|Detected|||||R||naralabs^naralabs||20190902191654|275022112
R|3|^^^HIV1mlDBS^HIV1.0mlDBS^489932^11790271^^P|28.21|cycle number||||R||naralabs^naralabs||20190902191654|275022112
`;

export class AbbottM2000ASTMParser
  extends BaseASTMParser
  implements IMessageParser
{
  transmission = '';
  instrument = null;

  constructor(transmission: string, instrument) {
    super();
    this.transmission = transmission;
    this.instrument = instrument;
  }

  private header_data = (record: string) => {
    const sender_info = this.get_field(record, 4);
    const receiver_info = this.get_field(record, 9);

    return {
      RecordType: this.get_field(record, 0),
      FieldDelimiter: this.field_delimiter,
      RepeatDelimiter: this.repeat_delimiter,
      ComponentDelimiter: this.component_delimiter,
      EscapeDelimiter: this.escape_delimiter,
      SenderName: this.get_component(sender_info, 0),
      SoftwareVersion: this.get_component(sender_info, 1),
      SerialNumber: this.get_component(sender_info, 2),
      InterfaceVersion: this.get_component(sender_info, 3),
      HostName: this.get_component(receiver_info, 0),
      IPAddress: this.get_component(receiver_info, 1),
      ProcessingID: this.get_field(record, 11),
      VersionNo: this.get_field(record, 12),
      DateTime: this.get_field(record, 13),
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
    return {
      RecordTypeId: this.get_field(record, 0),
      SequenceNumber: this.get_field(record, 1),
      SpecimenID: this.get(record, 2, 0),
      LocationID: this.get(record, 2, 1),
      Position: this.get(record, 2, 2),
      InstrumentSpecimenID: this.get(record, 3, 0),
      InstrumentLocationID: this.get(record, 3, 1),
      InstrumentPosition: this.get(record, 3, 2),
      TestID: this.get(record, 4, 3),
      AssayName: this.get(record, 4, 4),
      AssayProtocol: this.get(record, 4, 5),
      TestQualifier: this.get(record, 4, 6),
      Priority: this.get_field(record, 5),
      RequestedDateTime: this.get_field(record, 6),
      CollectionDateTime: this.get_field(record, 7),
      CollectionEndDateTime: this.get_field(record, 8),
      CollectorID: this.get_field(record, 10),
      ActionCode: this.get_field(record, 11),
      DangerCode: this.get_field(record, 12),
      ClinicalInformation: this.get_field(record, 13),
      ReceivedDateTime: this.get_field(record, 14),
      SpecimenType: this.get(record, 15, 0),
      SpecimenSource: this.get(record, 15, 1),
      OrderingPhysician: this.get_field(record, 16),
      UserField1: this.get_field(record, 18),
      UserField2: this.get_field(record, 19),
      InstrumentSectionID: this.get_field(record, 24),
      ReportType: this.get_field(record, 25),
      WardCollection: this.get_field(record, 26),
    };
  };

  private is_final_result = (some_result: { [id: string]: string }) => {
    // return I (intepreted) if exists else retun F (Final)
    if (some_result['ResultType'] == 'I') return true;
    if (some_result['ResultType'] == 'F') return true;
    return false;
  };

  private result_meta = (record: string) => {
    return {
      RecordTypeId: this.get(record, 0),
      SequenceNumber: this.get(record, 1),
      TestID: this.get(record, 2, 3),
      AssayName: this.get(record, 2, 4),
      AssayProtocol: this.get(record, 2, 5),
      TestQualifier: this.get(record, 2, 6),
      ResultType: this.get(record, 2, 8),
      Measurement: this.get(record, 3),
      Units: this.get(record, 4),
      ReferenceRangesRange: this.get(record, 5, 0),
      ReferenceRangesDescription: this.get(record, 5, 1),
      ResultAbnormalFlag: this.get(record, 6),
      NatureOfAbnormality: this.get(record, 7),
      ResultStatus: this.get(record, 8),
      DateChangeInstrumentValue: this.get(record, 9),
      Operator: this.get(record, 10, 0),
      Approver: this.get(record, 10, 1),
      DateTimeTestStarted: this.get(record, 11),
      DateTimeTestCompleted: this.get(record, 12),
      InstrumentIdentification: this.get(record, 14),
    };
  };

  private result_data = (records: string[]) => {
    // find and return final result
    const result_metas = records.map((r) => this.result_meta(r));
    if (result_metas.length === 1) return result_metas[0];
    const result = result_metas.filter((rm) => this.is_final_result(rm));
    if (result.length > 0) return result[0];
    return result_metas[0];
  };

  public is_supported = (): boolean => {
    if (this.instrument.protocol !== 'astm') {
      return false;
    }

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
    return header['SenderName'] === 'm2000';
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
            results['Measurement'] === 'Not detected'
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

const AbbottAlinityMHL7_MESSAGE_EXAMPLE = ``;
export class AbbottAlinityMHL7Parser implements IMessageParser {
  transmission = '';
  instrument = null;

  constructor(transmission: string, instrument) {
    this.transmission = transmission;
    this.instrument = instrument;
  }

  public is_supported = (): boolean => {
    if (this.instrument.protocol !== 'hl7') {
      return false;
    }
    const message = hl7parser.create(this.transmission);
    return message.get('MSH.3').toString() === 'ALINITY';
  };

  public run() {
    const message = hl7parser.create(this.transmission);

    const obx = message.get('OBX').toArray();
    const spm = message.get('SPM');

    const final: any[] = [];

    spm.forEach(function (singleSpm) {
      const singleObx = obx[0]; // there are twice as many OBX .. so we take the even number - 1 OBX for each SPM
      const resultOutcome = singleObx.get('OBX.5.1').toString();

      const order: any = {};

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
      order.analysed_date_time = formatRawDate(
        singleObx.get('OBX.19').toString(),
      );
      order.authorised_date_time = formatRawDate(
        singleObx.get('OBX.19').toString(),
      );
      order.result_accepted_date_time = formatRawDate(
        singleObx.get('OBX.19').toString(),
      );
      order.test_location = '';
      order.machine_used = '';

      // as CreateResultOrderDto
      const _read = () => {
        return {
          order_id: order.order_id,
          test_id: order.test_id,
          keyword: order.test_type,
          result: order.results,
          result_date: order.analysed_date_time,
          unit: order.test_unit,
          comment: '',
          is_sync_allowed: true,
          synced: false,
          sync_date: '',
          sync_comment: '',
          result_raw: this.transmission,
          instrument: this.instrument,
        };
      };

      final.push(_read());
    });

    return final;
  }
}
