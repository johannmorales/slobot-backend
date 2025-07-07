import {
  Injectable,
  NotFoundException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Hunt } from './entities/hunt.entity';
import { Repository } from 'typeorm';
import { SlotsService } from 'src/slots/slots.service';
import { Bonus, BonusStatus } from './entities/bonus.entity';
import { ReorderBonusesDto } from './dto/reorder-bonuses.dto';
import { AddBonusDto } from './dto/add-bonus.dto';
import { CreateHuntDto } from './dto/create-hunt.dto';
import { Slot } from 'src/slots/entities/slot.entity';
import { HuntsSseService } from './hunts-sse.service';
import { PaginationDto, PaginatedHuntsResponse } from './dto/pagination.dto';

@Injectable()
export class HuntsService {
  constructor(
    @InjectRepository(Hunt)
    private huntsRepository: Repository<Hunt>,
    @InjectRepository(Bonus)
    private bonusesRepository: Repository<Bonus>,
    @InjectRepository(Slot)
    private slotsRepository: Repository<Slot>,
    private readonly slotsService: SlotsService,
    @Inject(forwardRef(() => HuntsSseService))
    private readonly huntsSseService: HuntsSseService,
  ) {}

  async create(createHuntDto: CreateHuntDto) {
    // For now, we'll use a default discord channel ID since it's required
    // In a real application, you might want to get this from the request context
    const discordChannelId = 'default-channel';

    await this.huntsRepository.update(
      {
        discordChannelId,
      },
      {
        isActive: false,
      },
    );

    const hunt = await this.huntsRepository.insert({
      name: createHuntDto.name,
      discordChannelId,
      isActive: true,
    });

    return hunt;
  }

  async currentString() {
    const hunt = await this.findActive();
    return (
      hunt.bonuses
        ?.map(
          (bonus) =>
            `${bonus.slot?.name || 'Unknown'} ${bonus.bet?.amount || 0} ${bonus.bet?.currency || 'USD'}`,
        )
        .join('\n') || ''
    );
  }

  async findAll(paginationDto: PaginationDto): Promise<PaginatedHuntsResponse> {
    const { page = 1, pageSize = 10 } = paginationDto;
    const skip = (page - 1) * pageSize;

    const [hunts, total] = await this.huntsRepository.findAndCount({
      relations: {
        bonuses: {
          slot: true,
        },
      },
      order: {
        createdAt: 'DESC',
        bonuses: {
          orderIndex: 'ASC',
        },
      },
      skip,
      take: pageSize,
    });

    return {
      data: hunts,
      pagination: {
        page,
        pageSize,
        total,
      },
    };
  }

  async findActive() {
    const hunt = await this.huntsRepository.findOne({
      where: {
        isActive: true,
      },
      relations: {
        bonuses: {
          slot: true,
        },
      },
    });

    if (!hunt) {
      throw new Error('No active hunt found');
    }

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

    // Emit SSE event with updated bonuses
    await this.huntsSseService.emitHuntBonusesUpdate(huntId);

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

    // Emit SSE event with updated bonuses
    await this.huntsSseService.emitHuntBonusesUpdate(huntId);

    return { message: 'Bonus status updated successfully' };
  }

  async addBonusToHunt(huntId: number, addBonusDto: AddBonusDto) {
    // Find the hunt
    const hunt = await this.huntsRepository.findOne({
      where: { id: huntId },
    });

    if (!hunt) {
      throw new NotFoundException(`Hunt with id ${huntId} not found`);
    }

    // Find the slot
    const slot = await this.slotsRepository.findOne({
      where: { id: addBonusDto.slotId },
    });

    if (!slot) {
      throw new NotFoundException(
        `Slot with id ${addBonusDto.slotId} not found`,
      );
    }

    // Get the next order index for this hunt
    const maxOrderIndexResult = await this.bonusesRepository
      .createQueryBuilder('bonus')
      .where('bonus.hunt.id = :huntId', { huntId })
      .select('MAX(bonus.orderIndex)', 'maxOrder')
      .getRawOne<{ maxOrder: number | null }>();

    const nextOrderIndex = (maxOrderIndexResult?.maxOrder || -1) + 1;

    // Create the bonus
    const bonus = this.bonusesRepository.create({
      hunt,
      slot,
      value: addBonusDto.value,
      bet: {
        amount: parseFloat(addBonusDto.betAmount),
        currency: addBonusDto.currency,
      },
      notes: addBonusDto.notes,
      orderIndex: nextOrderIndex,
      status: BonusStatus.PENDING,
    });

    const savedBonus = await this.bonusesRepository.save(bonus);

    // Emit SSE event with updated bonuses
    await this.huntsSseService.emitHuntBonusesUpdate(huntId);

    return {
      id: savedBonus.id,
      slot: {
        id: slot.id,
        name: slot.name,
        provider: slot.provider,
        imageUrl: slot.imageUrl,
      },
      value: savedBonus.value,
      bet: savedBonus.bet,
      notes: savedBonus.notes,
      orderIndex: savedBonus.orderIndex,
      status: savedBonus.status,
      createdAt: savedBonus.createdAt,
    };
  }

  async getPendingBonuses(huntId: number) {
    const hunt = await this.huntsRepository.findOne({
      where: { id: huntId },
    });

    if (!hunt) {
      throw new NotFoundException(`Hunt with id ${huntId} not found`);
    }

    const pendingBonuses = await this.bonusesRepository.find({
      where: {
        hunt: { id: huntId },
        status: BonusStatus.PENDING,
      },
      relations: {
        slot: true,
      },
      order: {
        orderIndex: 'ASC',
      },
    });

    return pendingBonuses.map((bonus) => ({
      id: bonus.id,
      slot: {
        id: bonus.slot.id,
        name: bonus.slot.name,
        provider: bonus.slot.provider,
        imageUrl: bonus.slot.imageUrl,
        url: bonus.slot.url,
      },
      value: bonus.value,
      bet: bonus.bet,
      notes: bonus.notes,
    }));
  }

  async getAllBonusesForHunt(huntId: number) {
    const hunt = await this.huntsRepository.findOne({
      where: { id: huntId },
    });

    if (!hunt) {
      throw new Error(`Hunt with id ${huntId} not found`);
    }

    const bonuses = await this.bonusesRepository.find({
      where: {
        hunt: { id: huntId },
      },
      relations: {
        slot: true,
      },
      order: {
        orderIndex: 'ASC',
      },
    });

    return bonuses.map((bonus) => ({
      id: bonus.id,
      slot: {
        id: bonus.slot.id,
        name: bonus.slot.name,
        provider: bonus.slot.provider,
        imageUrl: bonus.slot.imageUrl,
        url: bonus.slot.url,
      },
      value: bonus.value,
      bet: bonus.bet,
      notes: bonus.notes,
    }));
  }
}
