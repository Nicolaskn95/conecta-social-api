import { Module } from '@nestjs/common';
import { FamilyService } from './family.service';
import { FamilyController } from './family.controller';
import { PrismaModule } from '@/config/prisma/prisma.module';
import { FamilyRepositoryImpl } from './repositories/family.repository.impl';
import { AuditLogModule } from '@/modules/audit-log/audit-log.module';

@Module({
  imports: [PrismaModule, AuditLogModule],
  controllers: [FamilyController],
  providers: [FamilyService, FamilyRepositoryImpl],
})
export class FamilyModule {}
