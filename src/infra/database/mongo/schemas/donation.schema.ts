import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { randomUUID } from 'crypto';

@Schema({
  collection: 'donations',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  versionKey: false,
})
export class DonationDoc {
  @Prop({ type: String, default: () => randomUUID() })
  _id: string;

  @Prop({ required: true, type: String, ref: 'CategoryDoc' })
  category_id: string;

  @Prop({ required: true, maxlength: 60 })
  name: string;

  @Prop({ type: String, default: null, maxlength: 250 })
  description: string | null;

  @Prop({ default: 0 })
  initial_quantity: number;

  @Prop({ default: 0 })
  current_quantity: number;

  @Prop({ type: String, default: null, maxlength: 90 })
  donator_name: string | null;

  @Prop({ type: String, default: null, maxlength: 10 })
  gender: string | null;

  @Prop({ type: String, default: null, maxlength: 20 })
  size: string | null;

  @Prop({ type: String, default: null, maxlength: 512 })
  image_key: string | null;

  @Prop({ type: String, default: null, maxlength: 63 })
  image_bucket: string | null;

  @Prop({ type: String, default: null, maxlength: 100 })
  image_content_type: string | null;

  @Prop({ type: String, default: null, maxlength: 255 })
  image_original_name: string | null;

  @Prop({ default: true })
  active: boolean;

  @Prop({ default: true })
  available: boolean;

  created_at: Date;
  updated_at: Date;
}

export const DonationSchema = SchemaFactory.createForClass(DonationDoc);
DonationSchema.index({ active: 1, available: 1 });
DonationSchema.index({ category_id: 1 });
DonationSchema.index({ active: 1, created_at: -1 });
