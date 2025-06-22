import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SlotsModule } from './slots/slots.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HuntsModule } from './hunts/hunts.module';
import { ElasticModule } from './elastic/elastic.module';
import { DiscordModule } from './discord/discord.module';
import { TasksModule } from './tasks/tasks.module';
import { getDatabaseConfig } from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ElasticModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) =>
        getDatabaseConfig(configService),
      inject: [ConfigService],
    }),
    SlotsModule,
    HuntsModule,
    DiscordModule,
    TasksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
