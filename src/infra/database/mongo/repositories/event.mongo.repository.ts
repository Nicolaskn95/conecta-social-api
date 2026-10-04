import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Event } from '@/domain/entities';
import {
  CreateEventData,
  EventRepository,
  UpdateEventData,
} from '@/domain/repositories';
import { EventDoc } from '../schemas';
import { toEntity, toEntityList } from '../mappers/to-entity';

@Injectable()
export class EventMongoRepository extends EventRepository {
  constructor(
    @InjectModel(EventDoc.name)
    private readonly eventModel: Model<EventDoc>
  ) {
    super();
  }

  async create(data: CreateEventData): Promise<Event> {
    const created = await this.eventModel.create({
      ...data,
      date: new Date(data.date),
      active: data.active ?? true,
    });
    return toEntity<Event>(created);
  }

  async findAll(): Promise<Event[]> {
    const docs = await this.eventModel.find().lean().exec();
    return toEntityList<Event>(docs);
  }

  async findAllActives(): Promise<Event[]> {
    const docs = await this.eventModel
      .find({ active: true })
      .lean()
      .exec();
    return toEntityList<Event>(docs);
  }

  async findById(id: string): Promise<Event | null> {
    const doc = await this.eventModel.findById(id).lean().exec();
    return doc ? toEntity<Event>(doc) : null;
  }

  async update(id: string, data: UpdateEventData): Promise<Event> {
    const updatePayload: any = { ...data };
    if (data.date) {
      updatePayload.date = new Date(data.date);
    }
    const updated = await this.eventModel
      .findByIdAndUpdate(id, { $set: updatePayload }, { new: true })
      .lean()
      .exec();
    return toEntity<Event>(updated);
  }

  async findUpcoming(from: Date, limit?: number): Promise<Event[]> {
    let query = this.eventModel
      .find({
        date: { $gte: from },
        active: true,
      })
      .sort({ date: 1 });

    if (limit && limit > 0) {
      query = query.limit(limit);
    }

    const docs = await query.lean().exec();
    return toEntityList<Event>(docs);
  }

  async findPast(before: Date, limit: number): Promise<Event[]> {
    const docs = await this.eventModel
      .find({
        date: { $lt: before },
        active: true,
      })
      .sort({ date: -1 })
      .limit(limit)
      .lean()
      .exec();
    return toEntityList<Event>(docs);
  }

  async findRecentWithInstagram(limit: number): Promise<Event[]> {
    const docs = await this.eventModel
      .find({
        active: true,
        embedded_instagram: { $ne: null, $nin: ['', null] },
      })
      .sort({ date: -1 })
      .limit(limit)
      .lean()
      .exec();
    return toEntityList<Event>(docs);
  }

  async findPaginated(skip: number, take: number): Promise<Event[]> {
    const docs = await this.eventModel
      .find({ active: true })
      .sort({ date: -1 })
      .skip(skip)
      .limit(take)
      .lean()
      .exec();
    return toEntityList<Event>(docs);
  }

  async countActives(): Promise<number> {
    return this.eventModel.countDocuments({ active: true }).exec();
  }
}
