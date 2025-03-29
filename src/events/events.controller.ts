import { Body, Controller, Post } from '@nestjs/common';
import { EventsService } from './events.service';
import { IEvent } from 'src/core/event/model/IEvent';

@Controller('events')
export class EventsController {
  constructor(private readonly event: EventsService) {}
  @Post('create')
  async create(@Body() event: IEvent) {
    console.log('controller', event);
    return event;
    // return this.event.create(event);
  }
}
