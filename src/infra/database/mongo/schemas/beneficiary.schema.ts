import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { randomUUID } from 'crypto';

@Schema({ collection: 'beneficiaries', timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, versionKey: false })
export class BeneficiaryDoc {
  @Prop({ type: String, default: () => randomUUID() }) _id: string;
  @Prop({ required: true, index: true }) id_family: string;
  @Prop({ required: true, maxlength: 30 }) name: string;
  @Prop({ required: true, maxlength: 60 }) surname: string;
  @Prop({ required: true }) birth_date: Date;
  @Prop({ type: String, default: null, maxlength: 11 }) cpf: string | null;
  @Prop({ type: String, default: null, maxlength: 15 }) rg: string | null;
  @Prop({ type: String, default: null, maxlength: 60 }) email: string | null;
  @Prop({ type: String, default: null, maxlength: 15 }) phone: string | null;
  @Prop({ required: true, maxlength: 30 }) gender: string;
  @Prop({ default: false }) has_disability: boolean;
  @Prop({ type: String, default: null, maxlength: 90 }) disability_details: string | null;
  @Prop({ default: true }) active: boolean;
  created_at: Date;
  updated_at: Date;
}
export const BeneficiarySchema = SchemaFactory.createForClass(BeneficiaryDoc);
BeneficiarySchema.index({ cpf: 1 }, { unique: true, partialFilterExpression: { cpf: { $type: 'string' } } });
BeneficiarySchema.index({ active: 1 });
BeneficiarySchema.index({ has_disability: 1 });
