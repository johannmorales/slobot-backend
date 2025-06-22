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
  name: 'list',
  description: 'list current hunt',
})
@Injectable()
export class ListCommand {
  private readonly logger = new Logger(ListCommand.name);

  constructor(
    @InjectDiscordClient()
    private readonly client: Client,
    private readonly huntsService: HuntsService,
  ) {}

  @Handler()
  async onHunt(@IA() interaction: CommandInteraction) {
    await interaction.deferReply({});

    await interaction.followUp({
      content: await this.huntsService.currentString(),
    });
  }
}
