import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { randomUUID } from 'crypto';

@Schema({
  collection: 'donations_to_family',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  versionKey: false,
})
export class DonationToFamilyDoc {
  @Prop({ type: String, default: () => randomUUID() })
  _id: string;

  @Prop({ required: true, type: String, ref: 'DonationDoc' })
  id_donation: string;

  @Prop({ required: true, type: String, ref: 'FamilyDoc' })
  id_family: string;

  @Prop({ required: true, type: Number })
  quantity: number;

  @Prop({ type: String, default: null, maxlength: 250 })
  update_message: string | null;

  @Prop({ default: true })
  active: boolean;

  created_at: Date;
  updated_at: Date;
}

export const DonationToFamilySchema =
  SchemaFactory.createForClass(DonationToFamilyDoc);
DonationToFamilySchema.index({ id_donation: 1 });
DonationToFamilySchema.index({ id_family: 1 });
DonationToFamilySchema.index({ active: 1, created_at: -1 });
