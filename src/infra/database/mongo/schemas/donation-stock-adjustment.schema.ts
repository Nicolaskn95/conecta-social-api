import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { randomUUID } from 'crypto';
import { DonationStockAdjustmentReason } from '@/domain/enums';

@Schema({
  collection: 'donation_stock_adjustments',
  timestamps: { createdAt: 'created_at', updatedAt: false },
  versionKey: false,
})
export class DonationStockAdjustmentDoc {
  @Prop({ type: String, default: () => randomUUID() })
  _id: string;

  @Prop({ required: true, type: String, ref: 'DonationDoc' })
  id_donation: string;

  @Prop({ required: true, type: String, ref: 'EmployeeDoc' })
  id_employee: string;

  @Prop({ required: true, type: Number })
  delta_quantity: number;

  @Prop({ required: true, type: Number })
  previous_quantity: number;

  @Prop({ required: true, type: Number })
  new_quantity: number;

  @Prop({
    required: true,
    type: String,
    enum: DonationStockAdjustmentReason,
  })
  reason: DonationStockAdjustmentReason;

  @Prop({ type: String, default: null, maxlength: 500 })
  note: string | null;

  created_at: Date;
}

export const DonationStockAdjustmentSchema = SchemaFactory.createForClass(
  DonationStockAdjustmentDoc
);
DonationStockAdjustmentSchema.index({ id_donation: 1, created_at: -1 });
DonationStockAdjustmentSchema.index({ id_employee: 1, created_at: -1 });
