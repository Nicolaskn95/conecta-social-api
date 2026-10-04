import { DynamicModule, Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  AuditLogDoc,
  AuditLogSchema,
  CategoryDoc,
  CategorySchema,
  DonationDoc,
  DonationSchema,
  DonationStockAdjustmentDoc,
  DonationStockAdjustmentSchema,
  DonationToFamilyDoc,
  DonationToFamilySchema,
  EmployeeDoc,
  EmployeeSchema,
  EventDoc,
  EventSchema,
  FamilyDoc,
  FamilySchema,
} from './schemas';
import {
  EmployeeRepository,
  EventRepository,
  FamilyRepository,
  CategoryRepository,
  DonationRepository,
  DonationToFamilyRepository,
  DonationStockAdjustmentRepository,
  AuditLogRepository,
  DashboardRepository,
} from '@/domain/repositories';
import { TransactionManager } from '@/domain/transaction/transaction-manager';
import { MongoTransactionManager } from './mongo-transaction-manager';
import { EmployeeMongoRepository } from './repositories/employee.mongo.repository';
import { EventMongoRepository } from './repositories/event.mongo.repository';
import { FamilyMongoRepository } from './repositories/family.mongo.repository';
import { CategoryMongoRepository } from './repositories/category.mongo.repository';
import { DonationMongoRepository } from './repositories/donation.mongo.repository';
import { DonationToFamilyMongoRepository } from './repositories/donation-to-family.mongo.repository';
import { DonationStockAdjustmentMongoRepository } from './repositories/donation-stock-adjustment.mongo.repository';
import { AuditLogMongoRepository } from './repositories/audit-log.mongo.repository';
import { DashboardMongoRepository } from './repositories/dashboard.mongo.repository';

const featureSchemas = [
  { name: EmployeeDoc.name, schema: EmployeeSchema },
  { name: EventDoc.name, schema: EventSchema },
  { name: FamilyDoc.name, schema: FamilySchema },
  { name: CategoryDoc.name, schema: CategorySchema },
  { name: DonationDoc.name, schema: DonationSchema },
  { name: DonationToFamilyDoc.name, schema: DonationToFamilySchema },
  {
    name: DonationStockAdjustmentDoc.name,
    schema: DonationStockAdjustmentSchema,
  },
  { name: AuditLogDoc.name, schema: AuditLogSchema },
];

const providers = [
  {
    provide: TransactionManager,
    useClass: MongoTransactionManager,
  },
  {
    provide: EmployeeRepository,
    useClass: EmployeeMongoRepository,
  },
  {
    provide: EventRepository,
    useClass: EventMongoRepository,
  },
  {
    provide: FamilyRepository,
    useClass: FamilyMongoRepository,
  },
  {
    provide: CategoryRepository,
    useClass: CategoryMongoRepository,
  },
  {
    provide: DonationRepository,
    useClass: DonationMongoRepository,
  },
  {
    provide: DonationToFamilyRepository,
    useClass: DonationToFamilyMongoRepository,
  },
  {
    provide: DonationStockAdjustmentRepository,
    useClass: DonationStockAdjustmentMongoRepository,
  },
  {
    provide: AuditLogRepository,
    useClass: AuditLogMongoRepository,
  },
  {
    provide: DashboardRepository,
    useClass: DashboardMongoRepository,
  },
];

@Global()
@Module({})
export class MongoDatabaseModule {
  static register(): DynamicModule {
    const uri =
      process.env.MONGODB_URI || 'mongodb://localhost:27017/conecta_social';

    return {
      module: MongoDatabaseModule,
      imports: [
        MongooseModule.forRoot(uri),
        MongooseModule.forFeature(featureSchemas),
      ],
      providers,
      exports: [MongooseModule, ...providers],
    };
  }
}
