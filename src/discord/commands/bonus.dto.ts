import { Param, Choice, ParamType } from '@discord-nestjs/core';

enum Currency {
  NGN = 'NGN',
  USD = 'USD',
  NZD = 'NZD',
}

export class BonusDto {
  @Param({ description: 'Slot name', required: true })
  slot: string;

  @Param({ description: 'Bet', required: true, type: ParamType.NUMBER })
  bet: number;

  @Choice(Currency)
  @Param({ description: 'Currency', required: true, type: ParamType.STRING })
  currency: Currency;

  @Param({
    description: 'Value in multiplier',
    required: false,
    type: ParamType.INTEGER,
  })
  value: number;

  @Param({ description: 'Notes', required: false, type: ParamType.STRING })
  notes: string;
}
