import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RESOURCE_MODULES } from './resources';
import { AppInitService } from './providers/initiliser';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Instrument } from './resources/instrument/entities/instrument.entity';
import config from 'ormconfig';
import { ResultOrder } from './resources/result-order/entities/result-order.entity';
import { ResultRaw } from './resources/result-order/entities/result_raw.entity';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      ...config,
      ...{
        host: `${process.env.POSTGRES_DATABASE_HOST}`,
        port: +process.env.POSTGRES_DATABASE_PORT,
        username: `${process.env.POSTGRES_DATABASE_USER}`,
        password: `${process.env.POSTGRES_DATABASE_PASSWORD}`,
        database: `${process.env.POSTGRES_DATABASE_NAME}`,
      },
      synchronize: true,
      entities: [Instrument, ResultOrder, ResultRaw],
    }),
    ...RESOURCE_MODULES,
  ],
  controllers: [AppController],
  providers: [AppService, AppInitService],
})
export class AppModule {}
