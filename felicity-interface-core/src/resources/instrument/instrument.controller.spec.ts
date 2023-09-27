import { Test, TestingModule } from '@nestjs/testing';
import { InstrumentController } from './instrument.controller';
import { InstrumentService } from './instrument.service';

describe('InstrumentController', () => {
  let controller: InstrumentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InstrumentController],
      providers: [InstrumentService],
    }).compile();

    controller = module.get<InstrumentController>(InstrumentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
