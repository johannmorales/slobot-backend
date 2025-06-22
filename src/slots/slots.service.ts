import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleInit,
} from '@nestjs/common';
import { CreateSlotDto } from './dto/create-slot.dto';
import { UpdateSlotDto } from './dto/update-slot.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Slot } from './entities/slot.entity';
import { Or, Repository, IsNull } from 'typeorm';
import { gamesCount, gamesList } from 'gamdom.js';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { TasksService } from 'src/tasks/tasks.service';

@Injectable()
export class SlotsService implements OnModuleInit {
  private readonly logger = new Logger(SlotsService.name);
  constructor(
    @InjectRepository(Slot)
    private slotsRepository: Repository<Slot>,
    private readonly elasticsearchService: ElasticsearchService,
    private tasksService: TasksService,
  ) {}

  async onModuleInit() {
    // Clean up existing null imageUrl values

    await this.elasticsearchService.indices.delete({ index: 'slots' });
    await this.elasticsearchService.indices.create({
      index: 'slots',
      mappings: {
        properties: {
          name: {
            type: 'text',
          },
        },
      },
    });
    // const slots = await this.slotsRepository.find();
    // const body = slots.flatMap((slot) => [
    //   { index: { _index: 'slots', _id: slot.id } },
    //   { name: slot.name },
    // ]);
    // await this.elasticsearchService.bulk({ body });
    //here!!
    this.tasksService.registerDailyTask('SlotsSync', async () => {
      // await this.elasticsearchService.indices.delete({ index: 'slots' });
      const indexExists = await this.elasticsearchService.indices.exists({
        index: 'slots',
      });
      if (!indexExists) {
        await this.elasticsearchService.indices.create({
          index: 'slots',
          mappings: {
            properties: {
              name: {
                type: 'text',
              },
            },
          },
        });
      }
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
        if (newSlots.length > 0) {
          const body = newSlots.flatMap((slot) => [
            { index: { _index: 'slots', _id: slot.id } },
            { name: slot.name },
          ]);
          await this.elasticsearchService.bulk({ body });
        }
        this.logger.log(
          `Added ${newSlots.length} slots => ${newSlots.map((slot) => `${slot.id} ${slot.name}`).join(', ')}`,
        );
      }
    });
  }

  create(createSlotDto: CreateSlotDto) {
    return 'This action adds a new slodt';
  }

  async findAll() {
    return await this.slotsRepository.find({
      where: [
        'Nolimit City',
        'Relax Gaming',
        // 'Just Slots',
        // 'Bullshark Games',
        'Hacksaw Gaming',
        'ShadyLady',
        'Pragmatic Play',
        // 'Bgaming',
      ].map((name) => ({ provider: name })),
    });
  }

  async query(q: string) {
    const { hits } = await this.elasticsearchService.search<
      string,
      { name: string }
    >({
      index: 'slots',
      query: {
        match: {
          name: {
            query: q,
            fuzziness: 'AUTO',
          },
        },
      },
    });

    const hit = hits.hits.find((hit) => hit._id!);

    if (!hit) return null;

    console.log('HIT', hit);

    return await this.slotsRepository.findOneBy({
      id: Number.parseInt(hit._id!),
    });
  }

  findOne(id: number) {
    return `This action returns a #${id} slot`;
  }

  update(id: number, updateSlotDto: UpdateSlotDto) {
    return `This action updates a #${id} slot`;
  }

  remove(id: number) {
    return `This action removes a #${id} slot`;
  }
}
