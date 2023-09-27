import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { InstrumentService } from './instrument.service';
import { CreateInstrumentDto } from './dto/create-instrument.dto';
import { UpdateInstrumentDto } from './dto/update-instrument.dto';
import { ApiTags } from '@nestjs/swagger';

@Controller('instrument')
@ApiTags('instrument')
export class InstrumentController {
  constructor(private readonly instrumentService: InstrumentService) {}

  @Post()
  async create(@Body() createInstrumentDto: CreateInstrumentDto) {
    return await this.instrumentService.create(createInstrumentDto);
  }

  @Get()
  async findAll() {
    return await this.instrumentService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.instrumentService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateInstrumentDto: UpdateInstrumentDto,
  ) {
    return await this.instrumentService.update(id, updateInstrumentDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.instrumentService.delete(id);
  }

  @Post(':id/connect')
  addConnection(@Param('id') id: string) {
    this.instrumentService.addConnection(id);
    return {
      message: 'Adding connection',
    };
  }

  @Post(':id/disconnect')
  removeConnection(@Param('id') id: string) {
    this.instrumentService.removeConnection(id);
    return {
      message: 'Removing connection',
    };
  }
}
