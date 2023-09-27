import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

const config: PostgresConnectionOptions = {
  type: 'postgres',
  host: `${process.env.POSTGRES_DATABASE_HOST}`,
  port: +process.env.POSTGRES_DATABASE_PORT,
  username: `${process.env.POSTGRES_DATABASE_USER}`,
  password: `${process.env.POSTGRES_DATABASE_PASSWORD}`,
  database: `${process.env.POSTGRES_DATABASE_NAME}`,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: true, // Must be false in production mode
};

export default config;
