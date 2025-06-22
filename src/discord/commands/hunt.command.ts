import {
  Command,
  Handler,
  IA,
  InjectDiscordClient,
} from '@discord-nestjs/core';
import { Client, CommandInteraction, MessageFlags } from 'discord.js';
import { Injectable, Logger } from '@nestjs/common';
import { SlashCommandPipe } from '@discord-nestjs/common';
import { BonusDto } from './bonus.dto';
import { HuntsService } from 'src/hunts/hunts.service';

@Command({
  name: 'hunt',
  description: 'Start a bonus hunt',
})
@Injectable()
export class HuntCommand {
  private readonly logger = new Logger(HuntCommand.name);

  constructor(
    @InjectDiscordClient()
    private readonly client: Client,
    private readonly huntsService: HuntsService,
  ) {}

  @Handler()
  async onHunt(@IA() interaction: CommandInteraction) {
    await interaction.deferReply({
      flags: MessageFlags.Ephemeral,
    });

    await this.huntsService.create(interaction.channelId);

    await interaction.followUp({
      content: 'Started hunt',
      flags: MessageFlags.Ephemeral,
    });
  }
}
