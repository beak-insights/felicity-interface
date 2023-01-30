import { Test, TestingModule } from '@nestjs/testing';
import { ResultOrderController } from './result-order.controller';
import { ResultOrderService } from './result-order.service';

describe('ResultOrderController', () => {
  let controller: ResultOrderController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ResultOrderController],
      providers: [ResultOrderService],
    }).compile();

    controller = module.get<ResultOrderController>(ResultOrderController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
