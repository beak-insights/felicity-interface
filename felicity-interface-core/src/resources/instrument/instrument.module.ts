import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InstrumentService } from './instrument.service';
import { InstrumentController } from './instrument.controller';
import { InstrumentConnectionService } from './instrument.connection';
import { InstrumentGateway } from './instrument.gateway';
import { InstrumentHandlerService } from './instrument.handler';
import { Instrument } from './entities/instrument.entity';
import { AllInclusiveParser } from './parsers';
import { ResultOrderModule } from '../result-order/result-order.module';

@Module({
  imports: [TypeOrmModule.forFeature([Instrument]), ResultOrderModule],
  controllers: [InstrumentController],
  providers: [
    InstrumentGateway,
    InstrumentHandlerService,
    InstrumentConnectionService,
    InstrumentService,
    AllInclusiveParser,
  ],
  exports: [InstrumentConnectionService],
})
export class InstrumentModule {}
