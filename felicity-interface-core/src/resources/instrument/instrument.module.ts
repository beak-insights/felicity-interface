import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InstrumentService } from './instrument.service';
import { InstrumentController } from './instrument.controller';
import { InstrumentConnectionService } from './instrument.connection';
import { InstrumentGateway } from './instrument.gateway';
import { InstrumentParserService } from './instrument.parser';
import { Instrument } from './entities/instrument.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Instrument])],
  controllers: [InstrumentController],
  providers: [
    InstrumentService,
    InstrumentConnectionService,
    InstrumentGateway,
    InstrumentParserService,
  ],
  exports: [InstrumentConnectionService],
})
export class InstrumentModule {}
