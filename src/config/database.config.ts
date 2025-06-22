import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  // Check if DATABASE_URL is provided (connection string)
  const databaseUrl = configService.get<string>('DATABASE_URL');
  return {
    type: 'postgres',
    url: databaseUrl,
    schema: 'public',
    namingStrategy: new SnakeNamingStrategy(),
    entities: [join(__dirname, '..', '**', '*.entity.{js,ts}')],
    synchronize: configService.get<string>('NODE_ENV') !== 'production',
    logging: configService.get<string>('NODE_ENV') !== 'production',
    ssl: {
      rejectUnauthorized: false,
    },
  };
};
