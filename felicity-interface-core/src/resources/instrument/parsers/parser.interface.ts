export interface IMessageParser {
  is_supported: () => boolean;
  run: () => any[];
}
