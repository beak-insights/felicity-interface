import { Module } from '@nestjs/common';
import { ResultOrderService } from './result-order.service';
import { ResultOrderController } from './result-order.controller';

@Module({
  controllers: [ResultOrderController],
  providers: [ResultOrderService]
})
export class ResultOrderModule {}
