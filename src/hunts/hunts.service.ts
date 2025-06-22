import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Hunt } from './entities/hunt.entity';
import { Repository } from 'typeorm';
import { SlotsService } from 'src/slots/slots.service';
import { BonusDto } from 'src/discord/commands/bonus.dto';
import { Bonus, BonusStatus } from './entities/bonus.entity';
import { ReorderBonusesDto } from './dto/reorder-bonuses.dto';

@Injectable()
export class HuntsService {
  constructor(
    @InjectRepository(Hunt)
    private huntsRepository: Repository<Hunt>,
    @InjectRepository(Bonus)
    private bonusesRepository: Repository<Bonus>,
    private readonly slotsService: SlotsService,
  ) {}

  async create(discordChannelId: string) {
    await this.huntsRepository.update(
      {
        discordChannelId,
      },
      {
        isActive: false,
      },
    );
    await this.huntsRepository.insert({
      discordChannelId,
      isActive: true,
    });
  }

  async currentString() {
    const hunt = (await this.findActive())!;
    return hunt.bonuses
      .map(
        (bonus) =>
          `${bonus.slot.name} ${bonus.bet.amount} ${bonus.bet.currency}`,
      )
      .join('\n');
  }

  async addBonus(dto: BonusDto) {
    return '!';
  }

  findAll() {
    return `This action returns all hunts`;
  }

  async findActive() {
    const hunt = await this.huntsRepository.findOne({
      where: {
        isActive: true,
        // bonuses: {
        //   status: BonusStatus.PENDING,
        // },
      },
      relations: {
        bonuses: {
          slot: true,
        },
      },
      order: {
        bonuses: {
          orderIndex: 'ASC',
        },
      },
    });

    // hunt?.bonuses.sort((a, b) => Number.parseInt(a.id) - Number.parseInt(b.id));
    // hunt?.bonuses.sort((a, b) => a.bet.amount - b.bet.amount);
    return hunt;
  }

  findOne(id: number) {
    return `This action returns a #${id} hunt`;
  }

  update(id: number) {
    return `This action updates a #${id} hunt`;
  }

  remove(id: number) {
    return `This action removes a #${id} hunt`;
  }

  async reorderBonuses(huntId: number, reorderDto: ReorderBonusesDto) {
    const hunt = await this.huntsRepository.findOne({
      where: { id: huntId },
    });

    if (!hunt) {
      throw new Error(`Hunt with id ${huntId} not found`);
    }

    await this.bonusesRepository
      .createQueryBuilder()
      .update(Bonus)
      .set({
        orderIndex: () =>
          'CASE ' +
          reorderDto.bonusIds
            .map((id, index) => `WHEN id = ${id} THEN ${index}`)
            .join(' ') +
          ' END',
      })
      .where('hunt.id = :huntId', { huntId })
      .andWhere('id IN (:...bonusIds)', { bonusIds: reorderDto.bonusIds })
      .execute();

    return { message: 'Bonuses reordered successfully' };
  }

  async updateBonusStatus(
    huntId: number,
    bonusId: number,
    status: BonusStatus,
  ) {
    const bonus = await this.bonusesRepository.findOne({
      where: { id: bonusId, hunt: { id: huntId } },
      relations: { hunt: true },
    });

    if (!bonus) {
      throw new Error(`Bonus with id ${bonusId} not found in hunt ${huntId}`);
    }

    await this.bonusesRepository.update(bonusId, { status });

    return { message: 'Bonus status updated successfully' };
  }
}
