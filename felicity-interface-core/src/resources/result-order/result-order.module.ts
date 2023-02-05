import { Module } from '@nestjs/common';
import { ResultOrderService } from './result-order.service';
import { ResultOrderController } from './result-order.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResultOrder } from './entities/result-order.entity';
import { ResultRaw } from './entities/result_raw.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ResultOrder, ResultRaw])],
  controllers: [ResultOrderController],
  providers: [ResultOrderService],
  exports: [ResultOrderService],
})
export class ResultOrderModule {}
