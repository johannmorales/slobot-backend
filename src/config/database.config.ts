import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const isProduction = configService.get<string>('NODE_ENV') === 'production';

  return {
    type: 'postgres',
    url: configService.get<string>('DATABASE_URL'),
    schema: 'public',
    namingStrategy: new SnakeNamingStrategy(),
    entities: [join(__dirname, '..', '**', '*.entity.{js,ts}')],
    synchronize: true,
    logging: false,
    ...(isProduction && {
      ssl: {
        rejectUnauthorized: false,
      },
    }),
  };
};
