import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString } from 'class-validator';
import { ResultRaw } from '../entities/result_raw.entity';
import { Instrument } from 'src/resources/instrument/entities/instrument.entity';

export class CreateResultOrderDto {
  @ApiProperty()
  @IsString()
  order_id: string;

  @ApiProperty()
  @IsString()
  test_id: string;

  @ApiProperty()
  @IsString()
  keyword: string;

  @ApiProperty()
  instrument: Instrument;

  @ApiProperty()
  @IsString()
  result: string;

  @ApiProperty()
  @IsString()
  result_date: string;

  @ApiProperty()
  @IsString()
  unit: string;

  @ApiProperty()
  @IsString()
  comment: string;

  @ApiProperty()
  @IsBoolean()
  is_sync_allowed: boolean;

  @ApiProperty()
  @IsBoolean()
  synced: boolean;

  @ApiProperty()
  @IsString()
  sync_date: string;

  @ApiProperty()
  @IsString()
  sync_comment: string;

  @ApiProperty()
  result_raw: string;
}
