import { IMessageParser } from './parser.interface';

const panther = `
H|\^&|||Panther|||||Host||P|1|
P|1||||^^|||||||||||^|^|||||||||||||||^|^|
O|1|662047|40ee8544-6076-4046-8dc0-601c18863cd7^37468|^^^qHIV-1^HIV-1^^1|R|20190808013102|||||||||||||||||||F
R|1|^^^qHIV-1^HIV-1^^1|Not Detected|copies/mL||||F||||20190808052856
R|2|^^^qHIV-1^ICResult^^1|15|||||F||||20190808052856
R|3|^^^qHIV-1^ResultValid^^1|Valid|||||F||||20190808052856
R|4|^^^qHIV-1^HIV-1LogBase10^^1|Not Detected|||||F||||20190808052856
P|2||||^^|||||||||||^|^|||||||||||||||^|^|
O|1|1203695|32d27901-3d12-4a21-97d5-ea003015f86b^37470|^^^qHIV-1^HIV-1^^1|R|20190808013102|||||||||||||||||||F
R|1|^^^qHIV-1^HIV-1^^1|Not Detected|copies/mL||||F||||20190808052855
R|2|^^^qHIV-1^ICResult^^1|14|||||F||||20190808052855
R|3|^^^qHIV-1^ResultValid^^1|Valid|||||F||||20190808052855
R|4|^^^qHIV-1^HIV-1LogBase10^^1|Not Detected|||||F||||20190808052855
P|3||||^^|||||||||||^|^|||||||||||||||^|^|
O|1|1203665|8df52f67-2aa4-4fc5-a301-551f7d222423^37471|^^^qHIV-1^HIV-1^^1|R|20190808013102|||||||||||||||||||F
R|1|^^^qHIV-1^HIV-1^^1|59|copies/mL||||F||||20190808052856
R|2|^^^qHIV-1^ICResult^^1|15|||||F||||20190808052856
R|3|^^^qHIV-1^ResultValid^^1|Valid|||||F||||20190808052856
R|4|^^^qHIV-1^HIV-1LogBase10^^1|1.77|||||F||||20190808052856
P|4||||^^|||||||||||^|^|||||||||||||||^|^|
`;

export class PantherASTMParser implements IMessageParser {
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
    return {
      RecordType: this.get_field(record, 0),
      FieldDelimiter: this.field_delimiter,
      RepeatDelimiter: this.repeat_delimiter,
      ComponentDelimiter: this.component_delimiter,
      EscapeDelimiter: this.escape_delimiter,
      SenderName: this.get_component(sender_info, 0),
    };
  };

  private patient_data = (record: string) => {
    return {
      RecordTypeId: this.get_field(record, 0),
      SequenceNumber: this.get_field(record, 1),
    };
  };

  private order_data = (record: string) => {
    return {
      RecordTypeId: this.get_field(record, 0),
      SequenceNumber: this.get_field(record, 1),
      SpecimenID: this.get(record, 2, 0),
      TestID: this.get(record, 4, 3),
      AssayName: this.get(record, 4, 4),
      AssayProtocol: this.get(record, 4, 5),
      TestQualifier: this.get(record, 4, 6),
      Priority: this.get_field(record, 5),
      RequestedDateTime: this.get_field(record, 6),
    };
  };

  private is_final_result = (
    some_result: { [id: string]: string },
    order_record: string,
  ) => {
    return (
      some_result['TestID'] === order_record['TestID'] &&
      some_result['AssayName'] === order_record['AssayName']
    );
  };

  private result_meta = (record: string) => {
    return {
      RecordTypeId: this.get(record, 0),
      SequenceNumber: this.get(record, 1),
      TestID: this.get(record, 2, 3),
      AssayName: this.get(record, 2, 4),
      Measurement: this.get(record, 3),
      Units: this.get(record, 4),
      DateTimeTestCompleted: this.get(record, 12),
    };
  };

  private result_data = (records: string[], order_record: string) => {
    // find and return final result
    const result_metas = records.map((r) => this.result_meta(r));
    if (result_metas.length === 1) return result_metas[0];
    const result = result_metas.filter((rm) =>
      this.is_final_result(rm, order_record),
    );
    if (result.length > 0) return result[0];
    return result_metas[0];
  };

  public is_supported = (): boolean => {
    // refactor to use '\nP|' as splitter
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
      header['SenderName'] === 'Panther' && this.instrument.protocol === 'astm'
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
      const results = this.result_data(results_record, order_record);

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
