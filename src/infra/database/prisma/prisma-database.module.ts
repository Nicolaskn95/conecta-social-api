import { DynamicModule, Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import {
  PrismaTransactionManager,
} from './prisma-transaction-manager';
import { TransactionManager } from '@/domain/transaction/transaction-manager';
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
import { EmployeePrismaRepository } from './repositories/employee.prisma.repository';
import { EventPrismaRepository } from './repositories/event.prisma.repository';
import { FamilyPrismaRepository } from './repositories/family.prisma.repository';
import { CategoryPrismaRepository } from './repositories/category.prisma.repository';
import { DonationPrismaRepository } from './repositories/donation.prisma.repository';
import { DonationToFamilyPrismaRepository } from './repositories/donation-to-family.prisma.repository';
import { DonationStockAdjustmentPrismaRepository } from './repositories/donation-stock-adjustment.prisma.repository';
import { AuditLogPrismaRepository } from './repositories/audit-log.prisma.repository';
import { DashboardPrismaRepository } from './repositories/dashboard.prisma.repository';

const providers = [
  PrismaService,
  {
    provide: TransactionManager,
    useClass: PrismaTransactionManager,
  },
  {
    provide: EmployeeRepository,
    useClass: EmployeePrismaRepository,
  },
  {
    provide: EventRepository,
    useClass: EventPrismaRepository,
  },
  {
    provide: FamilyRepository,
    useClass: FamilyPrismaRepository,
  },
  {
    provide: CategoryRepository,
    useClass: CategoryPrismaRepository,
  },
  {
    provide: DonationRepository,
    useClass: DonationPrismaRepository,
  },
  {
    provide: DonationToFamilyRepository,
    useClass: DonationToFamilyPrismaRepository,
  },
  {
    provide: DonationStockAdjustmentRepository,
    useClass: DonationStockAdjustmentPrismaRepository,
  },
  {
    provide: AuditLogRepository,
    useClass: AuditLogPrismaRepository,
  },
  {
    provide: DashboardRepository,
    useClass: DashboardPrismaRepository,
  },
];

@Global()
@Module({
  providers,
  exports: providers,
})
export class PrismaDatabaseModule {
  static register(): DynamicModule {
    return {
      module: PrismaDatabaseModule,
      providers,
      exports: providers,
    };
  }
}
