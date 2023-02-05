import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean, IsNumber } from 'class-validator';

export class CreateInstrumentDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  code: string;

  @ApiProperty()
  @IsString()
  protocol: string;

  @ApiProperty()
  @IsBoolean()
  isClient: boolean;

  @ApiProperty()
  @IsNumber()
  port: number;

  @ApiProperty()
  @IsString()
  host: string;

  @ApiProperty()
  @IsString()
  path: string;

  @ApiProperty()
  @IsNumber()
  baudRate: number;

  @ApiProperty()
  @IsBoolean()
  autoReconnect: boolean;

  @ApiProperty()
  @IsString()
  connectionType: string;

  @ApiProperty()
  @IsString()
  createdBy: string;
}
