import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
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
    private tasksService: TasksService,
  ) {}

  async onModuleInit() {
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
    return null;
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
