import { Injectable } from '@nestjs/common';
import { Instrument } from '../entities/instrument.entity';
import { AbbottM2000ASTMParser, AbbottAlinityMHL7Parser } from './abbott';
import {
  Roche68008800HL7Parser,
  RocheASTMPlusParser,
  RocheElecsysASTMParser,
} from './roche';
import { PantherASTMParser } from './panther';
import { GenericHL7Parser, ConcatenatedASTMParser } from './generic';

const PARSERS = [
  PantherASTMParser,
  AbbottM2000ASTMParser,
  RocheASTMPlusParser,
  Roche68008800HL7Parser,
  AbbottAlinityMHL7Parser,
  RocheElecsysASTMParser,
  // Generic parsers must be added last as a last resort
  GenericHL7Parser,
  ConcatenatedASTMParser,
];

@Injectable()
export class AllInclusiveParser {
  parse(transmissionString: string, instrument: Instrument) {
    const parser = this.get_suitable_parser(transmissionString, instrument);
    if (!parser) {
      console.log('No suitable parser was found');
      return;
    }
    return parser.run();
  }

  get_suitable_parser(transmissionString: string, instrument: Instrument) {
    const parsers = PARSERS.map(
      (cl) => new cl(transmissionString, instrument),
    ).filter((p) => p.is_supported());
    if (parsers.length === 0) {
      return;
    }
    // return first from available parsers
    return parsers[0];
  }
}
