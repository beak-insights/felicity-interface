import { Controller, Get, Body, Patch, Param, Delete } from '@nestjs/common';
import { ResultOrderService } from './result-order.service';
import { UpdateResultOrderDto } from './dto/update-result-order.dto';

@Controller('result-order')
export class ResultOrderController {
  constructor(private readonly resultOrderService: ResultOrderService) {}

  @Get()
  findAll() {
    return this.resultOrderService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.resultOrderService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateResultOrderDto: UpdateResultOrderDto,
  ) {
    return this.resultOrderService.update(id, updateResultOrderDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.resultOrderService.remove(id);
  }
}
