import { Injectable } from '@nestjs/common';
import { CreateResultOrderDto } from './dto/create-result-order.dto';
import { UpdateResultOrderDto } from './dto/update-result-order.dto';

@Injectable()
export class ResultOrderService {
  create(createResultOrderDto: CreateResultOrderDto) {
    return 'This action adds a new resultOrder';
  }

  findAll() {
    return `This action returns all resultOrder`;
  }

  findOne(id: number) {
    return `This action returns a #${id} resultOrder`;
  }

  update(id: number, updateResultOrderDto: UpdateResultOrderDto) {
    return `This action updates a #${id} resultOrder`;
  }

  remove(id: number) {
    return `This action removes a #${id} resultOrder`;
  }
}
