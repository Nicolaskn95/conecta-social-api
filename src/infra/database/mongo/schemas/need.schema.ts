import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { randomUUID } from 'crypto';
import { NeedStatus } from '../../../../domain/enums';
import { ItemSpecifications } from '../../../../domain/entities';
import { ItemSpecificationsSchema } from './item-specifications.schema';

@Schema({
  collection: 'needs',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  versionKey: false,
})
export class NeedDoc {
  @Prop({ type: String, default: () => randomUUID() }) _id: string;
  @Prop({ required: true }) id_family: string;
  @Prop({ type: String, default: null }) id_beneficiary: string | null;
  @Prop({ type: String, default: null, index: true }) item_type_id:
    | string
    | null;
  @Prop({ type: String, default: null, maxlength: 500 }) description:
    | string
    | null;
  @Prop({
    type: Number,
    default: null,
    min: 1,
    max: 2147483647,
    validate: (value: number | null) =>
      value === null || Number.isInteger(value),
  })
  requested_quantity: number | null;
  @Prop({ type: ItemSpecificationsSchema, default: null })
  specifications: ItemSpecifications | null;
  @Prop({ type: String, enum: NeedStatus, default: NeedStatus.OPEN })
  status: NeedStatus;
  @Prop({ type: String, default: null }) created_by: string | null;
  @Prop({ default: 0 }) version: number;
  created_at: Date;
  updated_at: Date;
}
export const NeedSchema = SchemaFactory.createForClass(NeedDoc);
NeedSchema.index({ id_family: 1, status: 1, created_at: 1 });
NeedSchema.index({ id_beneficiary: 1, status: 1, created_at: 1 });
NeedSchema.index({ status: 1, item_type_id: 1, created_at: 1 });
