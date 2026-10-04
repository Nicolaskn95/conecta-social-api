import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { randomUUID } from 'crypto';

@Schema({
  collection: 'categories',
  timestamps: { createdAt: 'created_at', updatedAt: false },
  versionKey: false,
})
export class CategoryDoc {
  @Prop({ type: String, default: () => randomUUID() })
  _id: string;

  @Prop({ required: true, maxlength: 25 })
  name: string;

  @Prop({ required: true, maxlength: 10 })
  measure_unity: string;

  @Prop({ default: true })
  active: boolean;

  created_at: Date;
}

export const CategorySchema = SchemaFactory.createForClass(CategoryDoc);
CategorySchema.index({ active: 1 });
