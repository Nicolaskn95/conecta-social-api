import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { randomUUID } from 'crypto';

@Schema({
  collection: 'item_types',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  versionKey: false,
})
export class ItemTypeDoc {
  @Prop({ type: String, default: () => randomUUID() }) _id: string;
  @Prop({ required: true, unique: true }) code: string;
  @Prop({ required: true }) name: string;
  @Prop({ required: true }) category_id: string;
  @Prop({ type: [String], default: [] }) aliases: string[];
  @Prop({ default: true }) active: boolean;
  created_at: Date;
  updated_at: Date;
}
export const ItemTypeSchema = SchemaFactory.createForClass(ItemTypeDoc);
ItemTypeSchema.index({ category_id: 1, active: 1 });
