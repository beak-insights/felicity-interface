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
  client: boolean;

  @ApiProperty()
  @IsNumber()
  clientPort: number;

  @ApiProperty()
  @IsString()
  clientHost: string;

  @ApiProperty()
  @IsBoolean()
  server: boolean;

  @ApiProperty()
  @IsNumber()
  serverPort: number;

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
