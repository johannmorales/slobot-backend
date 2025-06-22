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
  name: 'bonus',
  description: 'Add a bonus to current hunt',
})
@Injectable()
export class BonusCommand {
  private readonly logger = new Logger(BonusCommand.name);

  constructor(
    @InjectDiscordClient()
    private readonly client: Client,
    private readonly huntsService: HuntsService,
  ) {}

  @Handler()
  async onBonus(
    @IA(SlashCommandPipe) options: BonusDto,
    @IA() interaction: CommandInteraction,
  ) {
    await interaction.deferReply({
      flags: MessageFlags.Ephemeral,
    });
    await interaction.followUp({
      content: await this.huntsService.addBonus(options),
      flags: MessageFlags.Ephemeral,
    });
  }
}
