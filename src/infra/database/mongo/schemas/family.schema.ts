import { DeliveryMode } from '../../../../domain/enums';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { randomUUID } from 'crypto';

@Schema({
  collection: 'families',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  versionKey: false,
})
export class FamilyDoc {
  @Prop({
    type: Number,
    default: null,
    min: 0,
    max: 2147483647,
    validate: (value: number | null) =>
      value === null || Number.isInteger(value),
  })
  monthly_income_cents: number | null;

  @Prop({ type: String, maxlength: 250, default: null })
  housing_description: string | null;

  @Prop({ type: String, enum: DeliveryMode, default: null })
  preferred_delivery_mode: DeliveryMode | null;

  @Prop({ type: String, default: () => randomUUID() })
  _id: string;

  @Prop({ required: true, maxlength: 60 })
  name: string;

  @Prop({ required: true, maxlength: 60 })
  street: string;

  @Prop({ required: true, maxlength: 20 })
  number: string;

  @Prop({ required: true, maxlength: 60 })
  neighborhood: string;

  @Prop({ required: true, maxlength: 30 })
  city: string;

  @Prop({ required: true, maxlength: 20 })
  state: string;

  @Prop({ required: true, maxlength: 9 })
  cep: string;

  @Prop({ default: true })
  active: boolean;

  created_at: Date;
  updated_at: Date;
}

export const FamilySchema = SchemaFactory.createForClass(FamilyDoc);
FamilySchema.index({ active: 1, created_at: -1 });
