import {
  DeliveryMode,
  DonationAllocationStatus,
} from '../../../../domain/enums';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { randomUUID } from 'crypto';

@Schema({
  collection: 'donations_to_family',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  versionKey: false,
})
export class DonationToFamilyDoc {
  @Prop({ type: String, enum: DeliveryMode, default: null })
  delivery_mode: DeliveryMode | null;

  @Prop({ type: String, default: null })
  id_need: string | null;

  @Prop({ type: String, default: null })
  id_beneficiary: string | null;

  @Prop({ type: Date, default: null })
  separated_at: Date | null;

  @Prop({ type: Date, default: null })
  received_at: Date | null;

  @Prop({ type: Date, default: null })
  confirmed_at: Date | null;

  @Prop({ type: Date, default: null })
  canceled_at: Date | null;

  @Prop({ type: String, default: null })
  separated_by: string | null;

  @Prop({ type: String, default: null })
  confirmed_by: string | null;

  @Prop({ type: String, default: null })
  canceled_by: string | null;

  @Prop({ type: String, default: null })
  request_id: string | null;

  @Prop({ type: String, default: null, maxlength: 64 })
  request_fingerprint: string | null;

  @Prop({
    type: String,
    enum: DonationAllocationStatus,
    default: DonationAllocationStatus.UNKNOWN,
  })
  status: DonationAllocationStatus;

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

DonationToFamilySchema.index({ id_beneficiary: 1 });
DonationToFamilySchema.index({ id_need: 1, status: 1 });
DonationToFamilySchema.index({ status: 1, separated_at: 1 });
DonationToFamilySchema.index(
  { request_id: 1 },
  {
    unique: true,
    partialFilterExpression: { request_id: { $type: 'string' } },
  }
);
