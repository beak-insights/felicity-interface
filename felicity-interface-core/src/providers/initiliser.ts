import { Injectable, Logger } from '@nestjs/common';
import { InstrumentConnectionService } from 'src/resources/instrument/instrument.connection';

@Injectable()
export class AppInitService {
  constructor(
    private readonly instrumentConnectionService: InstrumentConnectionService,
  ) {}

  public initialize() {
    Logger.log('App Initialiser starting ...');
    Logger.log('init instruments ...');
    this.instrumentConnectionService.initialize();
    Logger.log('App Initialiser complete.');
  }
}
