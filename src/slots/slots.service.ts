import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Slot } from './entities/slot.entity';
import { Repository } from 'typeorm';
import { gamesCount, gamesList } from 'gamdom.js';
import { TasksService } from 'src/tasks/tasks.service';
import { SearchResult } from './types/search.types';

@Injectable()
export class SlotsService implements OnModuleInit {
  private readonly logger = new Logger(SlotsService.name);
  constructor(
    @InjectRepository(Slot)
    private slotsRepository: Repository<Slot>,
    private tasksService: TasksService,
  ) {}

  onModuleInit() {
    // Clean up existing null imageUrl values

    // const slots = await this.slotsRepository.find();
    // const body = slots.flatMap((slot) => [
    //   { index: { _index: 'slots', _id: slot.id } },
    //   { name: slot.name },
    // ]);
    // await this.elasticsearchService.bulk({ body });
    //here!!
    this.tasksService.registerDailyTask('SlotsSync', async () => {
      // await this.elasticsearchService.indices.delete({ index: 'slots' });
      const number = await gamesCount({ sectionType: 'slots' });
      const pages = Math.floor(number / 100) + 1;
      for (let i = 0; i < pages; i++) {
        await new Promise((r) => setTimeout(r, 1000));
        this.logger.log(`Syncing slots: page ${i + 1}/${pages}`);
        const {
          games: [{ gamesList: games }],
        } = await gamesList([{ sectionType: 'slots', limit: 100, page: i }]);
        if (i === 3) console.log(games[1], games[2]);
        const slots: Partial<Slot>[] = games.map((game) => ({
          key: `gamdom__${game.staticData.game_code}`,
          name: game.staticData.name,
          provider: game.staticData.provider_name,
          imageUrl: `${game.staticData.url_thumb.charAt(0) === '/' ? 'https://www.gamdom.com' : ''}${game.staticData.url_thumb}`,
          url: `https://gamdom.com/casino/${encodeURIComponent(game.staticData.name)}_${encodeURIComponent(game.staticData.provider_name)}`,
          releaseDate: new Date(game.staticData.created),
          // originalJson: JSON.stringify(game, null, 2),
        }));
        const insertResult = await this.slotsRepository
          .createQueryBuilder()
          .insert()
          .into(Slot)
          .values(slots)
          .orIgnore()
          .execute();
        const newSlots = insertResult.identifiers
          .map((item, index) => ({
            id: item?.id as number,
            index,
          }))
          .filter((item) => item.id !== undefined)
          .map((item) => ({
            id: item.id,
            ...slots[item.index],
          }));
        this.logger.log(
          `Added ${newSlots.length} slots => ${newSlots.map((slot) => `${slot.id} ${slot.name}`).join(', ')}`,
        );

        // Update search vectors for new slots
        if (newSlots.length > 0) {
          await this.updateSearchVectors(newSlots.map((slot) => slot.id));
        }
      }
    });
  }

  private async updateSearchVectors(slotIds: number[]) {
    try {
      await this.slotsRepository.query(
        `
        UPDATE slot 
        SET search_vector = to_tsvector('english', name)
        WHERE id = ANY($1)
      `,
        [slotIds],
      );
    } catch (error) {
      this.logger.error('Failed to update search vectors:', error);
    }
  }

  async updateAllSearchVectors() {
    try {
      await this.slotsRepository.query(`
        UPDATE slot 
        SET search_vector = to_tsvector('english', name)
        WHERE search_vector IS NULL OR search_vector = ''
      `);
      this.logger.log('All search vectors updated successfully');
    } catch (error) {
      this.logger.error('Failed to update all search vectors:', error);
    }
  }

  create() {
    return 'This action adds a new slot';
  }

  async findAll() {
    const slots = await this.slotsRepository.find({
      where: [
        'Nolimit City',
        'Relax Gaming',
        'Just Slots',
        // 'Bullshark Games',
        'Hacksaw Gaming',
        'ShadyLady',
        'Pragmatic Play',
        'Bgaming',
      ].map((name) => ({ provider: name })),
      order: {
        releaseDate: 'DESC',
      },
    });

    return slots.map((slot) => ({
      id: slot.id,
      name: slot.name,
      provider: slot.provider,
      imageUrl: slot.imageUrl,
      url: slot.url,
      releaseDate: slot.releaseDate,
    }));
  }

  async query(q: string): Promise<SearchResult[]> {
    if (!q || q.trim().length < 3) {
      return [];
    }

    try {
      const slots = await this.slotsRepository
        .createQueryBuilder('slot')
        .where(`slot.search_vector @@ plainto_tsquery('english', :query)`)
        .setParameter('query', q)
        .orderBy(
          `ts_rank(slot.search_vector, plainto_tsquery('english', :query))`,
          'DESC',
        )
        .addOrderBy('slot.releaseDate', 'DESC')
        .limit(10)
        .getMany();

      return slots.map((slot) => ({
        id: slot.id,
        name: slot.name,
        provider: slot.provider,
        imageUrl: slot.imageUrl,
        url: slot.url,
        releaseDate: slot.releaseDate,
      }));
    } catch (error) {
      this.logger.error('Search query failed:', error);
      return [];
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} slot`;
  }

  remove(id: number) {
    return `This action removes a #${id} slot`;
  }
}
