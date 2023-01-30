import { Injectable } from '@nestjs/common';
import { CreateInstrumentDto } from './dto/create-instrument.dto';
import { UpdateInstrumentDto } from './dto/update-instrument.dto';
import { Repository, UpdateResult } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Instrument } from './entities/instrument.entity';

@Injectable()
export class InstrumentService {
  constructor(
    @InjectRepository(Instrument)
    private instrumentRepository: Repository<Instrument>,
  ) {}

  async create(instrumentDto: CreateInstrumentDto): Promise<Instrument> {
    return await this.instrumentRepository.save(instrumentDto);
  }

  async findAll(query = {}): Promise<Instrument[]> {
    return await this.instrumentRepository.find(query);
  }

  async findOne(id: string): Promise<Instrument | null> {
    return await this.findOneBy({ id });
  }

  async findOneBy(query = {}): Promise<Instrument | null> {
    return await this.instrumentRepository.findOneBy(query);
  }

  async update(
    id: string,
    instrumentDto: UpdateInstrumentDto,
  ): Promise<Instrument | null> {
    await this.instrumentRepository.update(id, instrumentDto);
    return await this.findOne(id);
  }

  async delete(id: string) {
    return await this.instrumentRepository.delete(id);
  }
}
