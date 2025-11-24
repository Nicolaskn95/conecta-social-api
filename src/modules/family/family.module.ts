import { Module } from '@nestjs/common';
import { FamilyService } from './family.service';
import { FamilyController } from './family.controller';
import { PrismaModule } from '@/config/prisma/prisma.module';
import { FamilyRepositoryImpl } from './repositories/family.repository.impl';

@Module({
  imports: [PrismaModule],
  controllers: [FamilyController],
  providers: [FamilyService, FamilyRepositoryImpl],
})
export class FamilyModule {}
