import { Test, TestingModule } from '@nestjs/testing';
import { ResultOrderService } from './result-order.service';

describe('ResultOrderService', () => {
  let service: ResultOrderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ResultOrderService],
    }).compile();

    service = module.get<ResultOrderService>(ResultOrderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
