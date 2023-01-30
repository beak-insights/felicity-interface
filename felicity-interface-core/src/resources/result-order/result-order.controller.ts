import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ResultOrderService } from './result-order.service';
import { CreateResultOrderDto } from './dto/create-result-order.dto';
import { UpdateResultOrderDto } from './dto/update-result-order.dto';

@Controller('result-order')
export class ResultOrderController {
  constructor(private readonly resultOrderService: ResultOrderService) {}

  @Post()
  create(@Body() createResultOrderDto: CreateResultOrderDto) {
    return this.resultOrderService.create(createResultOrderDto);
  }

  @Get()
  findAll() {
    return this.resultOrderService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.resultOrderService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateResultOrderDto: UpdateResultOrderDto) {
    return this.resultOrderService.update(+id, updateResultOrderDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.resultOrderService.remove(+id);
  }
}
