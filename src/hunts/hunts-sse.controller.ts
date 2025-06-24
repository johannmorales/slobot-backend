import { Controller, Get, Param, Res, Sse } from '@nestjs/common';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { HuntsSseService } from './hunts-sse.service';

@Controller('hunts-sse')
export class HuntsSseController {
  constructor(private readonly huntsSseService: HuntsSseService) {}

  @Sse(':huntId')
  huntUpdates(@Param('huntId') huntId: string): Observable<string> {
    console.log('huntUpdates', huntId);
    return this.huntsSseService.getHuntUpdates(+huntId);
  }

  @Get(':huntId/health')
  health(@Param('huntId') huntId: string, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/plain');
    res.send(`SSE endpoint for hunt ${huntId} is active`);
  }
}
