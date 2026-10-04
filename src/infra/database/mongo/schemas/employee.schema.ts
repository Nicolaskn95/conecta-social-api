import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { randomUUID } from 'crypto';
import { EmployeeRole } from '@/domain/enums';

@Schema({
  collection: 'employees',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  versionKey: false,
})
export class EmployeeDoc {
  @Prop({ type: String, default: () => randomUUID() })
  _id: string;

  @Prop({ required: true, maxlength: 30 })
  name: string;

  @Prop({ required: true, maxlength: 60 })
  surname: string;

  @Prop({ required: true, type: Date })
  birth_date: Date;

  @Prop({ required: true, unique: true, maxlength: 11 })
  cpf: string;

  @Prop({ required: true, unique: true, maxlength: 60 })
  email: string;

  @Prop({ required: true, maxlength: 15 })
  phone: string;

  @Prop({ required: true, maxlength: 128 })
  password: string;

  @Prop({
    type: String,
    enum: EmployeeRole,
    default: EmployeeRole.VOLUNTEER,
  })
  role: EmployeeRole;

  @Prop({ required: true, maxlength: 9 })
  cep: string;

  @Prop({ required: true, maxlength: 100 })
  street: string;

  @Prop({ required: true, maxlength: 60 })
  neighborhood: string;

  @Prop({ required: true, maxlength: 20 })
  number: string;

  @Prop({ required: true, maxlength: 30 })
  city: string;

  @Prop({ required: true, maxlength: 20 })
  state: string;

  @Prop({ type: String, default: null, maxlength: 30 })
  complement: string | null;

  @Prop({ default: true })
  active: boolean;

  created_at: Date;
  updated_at: Date;
}

export const EmployeeSchema = SchemaFactory.createForClass(EmployeeDoc);
EmployeeSchema.index({ active: 1, role: 1 });
