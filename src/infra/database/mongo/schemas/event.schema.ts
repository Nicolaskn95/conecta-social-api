import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { randomUUID } from 'crypto';
import { EventStatus } from '@/domain/enums';

@Schema({
  collection: 'events',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  versionKey: false,
})
export class EventDoc {
  @Prop({ type: String, default: () => randomUUID() })
  _id: string;

  @Prop({ required: true, maxlength: 100 })
  name: string;

  @Prop({ type: String, default: null, maxlength: 1000 })
  description: string | null;

  @Prop({ required: true, type: Date })
  date: Date;

  @Prop({ type: String, default: null, maxlength: 1000 })
  greeting_description: string | null;

  @Prop({ type: Number, default: null })
  attendance: number | null;

  @Prop({ type: String, default: null })
  embedded_instagram: string | null;

  @Prop({
    type: String,
    enum: EventStatus,
    default: EventStatus.SCHEDULED,
  })
  status: EventStatus;

  @Prop({ required: true, maxlength: 100 })
  street: string;

  @Prop({ required: true, maxlength: 30 })
  neighborhood: string;

  @Prop({ required: true, maxlength: 20 })
  number: string;

  @Prop({ required: true, maxlength: 30 })
  city: string;

  @Prop({ required: true, maxlength: 20 })
  state: string;

  @Prop({ required: true, maxlength: 9 })
  cep: string;

  @Prop({ type: String, default: null, maxlength: 30 })
  complement: string | null;

  @Prop({ default: true })
  active: boolean;

  created_at: Date;
  updated_at: Date;
}

export const EventSchema = SchemaFactory.createForClass(EventDoc);
EventSchema.index({ active: 1, date: -1 });
EventSchema.index({ active: 1, date: 1 });
