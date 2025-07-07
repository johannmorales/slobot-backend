import { Module } from '@nestjs/common';
import { DiscordModule as NestJsDiscordModule } from '@discord-nestjs/core';
import { GatewayIntentBits } from 'discord.js';
import { ConfigService } from '@nestjs/config';
import { DiscordGateway } from './discord.gateway';
import { HuntsModule } from 'src/hunts/hunts.module';
import { HuntCommand } from './commands/hunt.command';
import { ListCommand } from './commands/list.command';

@Module({
  imports: [
    NestJsDiscordModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const token = configService.get<string>('SLOBOT_DISCORD_TOKEN');
        if (!token) {
          throw new Error(
            'SLOBOT_DISCORD_TOKEN environment variable is required',
          );
        }
        return {
          token,
          discordClientOptions: {
            intents: [GatewayIntentBits.Guilds],
          },
        };
      },
    }),
    HuntsModule,
  ],
  providers: [DiscordGateway, ListCommand],
})
export class DiscordModule {}
