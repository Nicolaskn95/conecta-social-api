import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { randomUUID } from 'crypto';
import {
  AuditActionType,
  AuditEntityType,
  EmployeeRole,
} from '@/domain/enums';

@Schema({
  collection: 'audit_logs',
  timestamps: { createdAt: 'created_at', updatedAt: false },
  versionKey: false,
})
export class AuditLogDoc {
  @Prop({ type: String, default: () => randomUUID() })
  _id: string;

  @Prop({
    required: true,
    type: String,
    enum: AuditEntityType,
  })
  entity_type: AuditEntityType;

  @Prop({ required: true, maxlength: 64 })
  entity_id: string;

  @Prop({
    required: true,
    type: String,
    enum: AuditActionType,
  })
  action_type: AuditActionType;

  @Prop({ type: String, default: null, ref: 'EmployeeDoc' })
  actor_employee_id: string | null;

  @Prop({
    type: String,
    enum: EmployeeRole,
    default: null,
  })
  actor_role: EmployeeRole | null;

  @Prop({ required: true, maxlength: 250 })
  message: string;

  @Prop({ type: MongooseSchema.Types.Mixed, default: null })
  metadata: any;

  created_at: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLogDoc);
AuditLogSchema.index({ entity_type: 1, entity_id: 1, created_at: -1 });
AuditLogSchema.index({ actor_employee_id: 1, created_at: -1 });
AuditLogSchema.index({ created_at: -1 });
