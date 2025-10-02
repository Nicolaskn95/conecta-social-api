import { Module } from '@nestjs/common';
import { FamilyService } from './family.service';
import { FamilyController } from './family.controller';
import { PrismaModule } from '@/config/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FamilyController],
  providers: [FamilyService],
})
export class FamilyModule {}
