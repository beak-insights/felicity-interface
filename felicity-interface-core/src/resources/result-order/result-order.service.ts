import { Injectable } from '@nestjs/common';
import { CreateResultOrderDto } from './dto/create-result-order.dto';
import { UpdateResultOrderDto } from './dto/update-result-order.dto';
import { Repository } from 'typeorm';
import { ResultOrder } from './entities/result-order.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ResultRaw } from './entities/result_raw.entity';

@Injectable()
export class ResultOrderService {
  constructor(
    @InjectRepository(ResultOrder)
    private orderRepository: Repository<ResultOrder>,
    @InjectRepository(ResultRaw)
    private rawRepository: Repository<ResultRaw>,
  ) {}

  async createAll(orders: CreateResultOrderDto[]) {
    for (const order of orders) {
      const exists = await this.findOneBy({ order_id: order.order_id });
      if (!exists) {
        const result_raw = await this.createRaw(order.result_raw);
        await this.orderRepository.save({
          ...order,
          result_raw,
        });
      }
    }
  }

  async createRaw(content: string) {
    return await this.rawRepository.save({ content });
  }

  async findAll(query = {}) {
    return await this.orderRepository.find(query);
  }

  async findOne(id: string) {
    return await this.orderRepository.findOneBy({ id });
  }

  async findOneBy(query = {}) {
    return await this.orderRepository.findOneBy(query);
  }

  async update(id: string, orderDto: UpdateResultOrderDto) {
    return this.orderRepository.update({ id }, orderDto);
  }

  remove(id: string) {
    return this.orderRepository.delete(id);
  }
}
