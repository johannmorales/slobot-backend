// @ts-nocheck
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Slot } from './entities/slot.entity';
import { Repository } from 'typeorm';
import { gamesCount, gamesList } from 'gamdom.js';
import { TasksService } from 'src/tasks/tasks.service';
import { SearchResult } from './types/search.types';
import { ElasticsearchService } from '@nestjs/elasticsearch';

@Injectable()
export class SlotsService implements OnModuleInit {
  private readonly logger = new Logger(SlotsService.name);
  constructor(
    @InjectRepository(Slot)
    private slotsRepository: Repository<Slot>,
    private tasksService: TasksService,
    private elasticsearchService: ElasticsearchService,
  ) {}

  onModuleInit() {
    this.tasksService.registerDailyTask('SlotsSync', async () => {
      const number = await gamesCount({ sectionType: 'slots' });
      const pages = Math.floor(number / 100) + 1;
      for (let i = 0; i < pages; i++) {
        await new Promise((r) => setTimeout(r, 1000));
        this.logger.log(`Syncing slots: page ${i + 1}/${pages}`);
        const {
          games: [{ gamesList: games }],
        } = await gamesList([{ sectionType: 'slots', limit: 100, page: i }]);
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
      }
      await this.updateElasticsearch();
    });
  }

  async updateElasticsearch() {
    const exists = await this.elasticsearchService.indices.exists({
      index: 'slots',
    });
    if (exists) {
      await this.elasticsearchService.indices.delete({ index: 'slots' });
    }
    await this.elasticsearchService.indices.create({ index: 'slots' });
    const slots = await this.slotsRepository.find();
    const body = slots.flatMap((slot) => [
      { index: { _index: 'slots', _id: slot.id } },
      { name: slot.name, provider: slot.provider },
    ]);
    await this.elasticsearchService.bulk({ body });
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
      const searchResponse = await this.elasticsearchService.search({
        index: 'slots',
        body: {
          query: {
            multi_match: {
              query: q,
              fields: ['name'],
              fuzziness: 'AUTO',
            },
          },
          size: 10,
        },
      });

      // Extract IDs from Elasticsearch results
      const response = searchResponse as any;
      const hits = response.body?.hits?.hits || [];
      const slotIds: string[] = hits.map((hit: any) => hit._id);

      if (slotIds.length === 0) {
        return [];
      }

      // Query database to get full slot records by IDs
      const slots = await this.slotsRepository
        .createQueryBuilder('slot')
        .where('slot.id IN (:...ids)', { ids: slotIds })
        .getMany();

      // Sort results by the order returned from Elasticsearch
      const sortedSlots = slotIds
        .map((id) => slots.find((slot) => slot.id.toString() === id))
        .filter((slot): slot is Slot => slot !== undefined);

      return sortedSlots.map((slot) => ({
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
