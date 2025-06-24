import { Injectable } from '@nestjs/common';
import { Subject, Observable, of, concat } from 'rxjs';
import { map, filter, switchMap } from 'rxjs/operators';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bonus } from './entities/bonus.entity';

export interface HuntUpdateEvent {
  huntId: number;
  bonuses: any[];
  eventType: 'initial_data' | 'bonuses_updated';
  timestamp: Date;
}

@Injectable()
export class HuntsSseService {
  private huntUpdates = new Subject<HuntUpdateEvent>();

  constructor(
    @InjectRepository(Bonus)
    private bonusesRepository: Repository<Bonus>,
  ) {}

  /**
   * Get initial hunt data and format it as an SSE event
   */
  private async getInitialHuntData(huntId: number): Promise<HuntUpdateEvent> {
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

    const formattedBonuses = bonuses.map((bonus) => ({
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
      status: bonus.status,
    }));

    return {
      huntId,
      bonuses: formattedBonuses,
      eventType: 'bonuses_updated',
      timestamp: new Date(),
    };
  }

  /**
   * Emit an update for a specific hunt
   */
  async emitHuntBonusesUpdate(huntId: number) {
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

    const formattedBonuses = bonuses.map((bonus) => ({
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
      status: bonus.status,
    }));

    const event: HuntUpdateEvent = {
      huntId,
      bonuses: formattedBonuses,
      eventType: 'bonuses_updated',
      timestamp: new Date(),
    };
    this.huntUpdates.next(event);
  }

  /**
   * Get observable for updates on a specific hunt
   * First sends initial data, then continues with real-time updates
   */
  getHuntUpdates(huntId: number): Observable<string> {
    // Get initial data as an observable
    const initialData$ = of(null).pipe(
      switchMap(async () => {
        const initialEvent = await this.getInitialHuntData(huntId);
        return `data: ${JSON.stringify(initialEvent)}\n\n`;
      }),
    );

    // Get real-time updates as an observable
    const realTimeUpdates$ = this.huntUpdates.asObservable().pipe(
      filter((event) => event.huntId === huntId),
      map((event) => `data: ${JSON.stringify(event)}\n\n`),
    );

    // Concatenate initial data with real-time updates
    return concat(initialData$, realTimeUpdates$);
  }
}
