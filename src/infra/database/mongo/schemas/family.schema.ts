import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { randomUUID } from 'crypto';

@Schema({
  collection: 'families',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  versionKey: false,
})
export class FamilyDoc {
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
