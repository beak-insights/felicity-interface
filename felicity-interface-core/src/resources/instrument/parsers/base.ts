export abstract class BaseASTMParser {
  field_delimiter: string;
  repeat_delimiter: string;
  component_delimiter: string;
  escape_delimiter: string;

  get_delimiter = (header_record: string, index: number) =>
    header_record[index];

  get_field = (record: string, index: number): string => {
    const fields = record.split(this.field_delimiter);
    return fields[index];
  };

  get_component = (field: string, index: number) => {
    const comps = field.split(this.component_delimiter);
    return comps[index];
  };

  get = (
    record: string,
    field_index: number,
    component_index: number | undefined = undefined,
  ) => {
    const field = this.get_field(record, field_index);
    if (!component_index) return field;
    return this.get_component(field, component_index);
  };

  get_record_for = (dataLines: string[], key: string): string[] =>
    dataLines.filter((dl) => dl.indexOf(key) === 0);
}
