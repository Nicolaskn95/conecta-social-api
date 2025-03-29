import { Injectable } from '@nestjs/common';
import { IEvent } from 'src/core/event/model/IEvent';
import { PrismaService } from 'src/db/prisma.service';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: IEvent) {
    const { id, embedPostInstagram, ...rest } = data;
    console.log(data);
    // console.log(embedPostInstagram);

    const event = await this.prisma.event.create({
      data: {
        embedPostInstagram: embedPostInstagram,
        ...rest,
        userId: data.userId,
      },
    });
    return event;
  }
}
