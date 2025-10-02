import { Module } from '@nestjs/common';
import { DonationController } from './controllers/donation.controller';
import { DonationService } from './services/donation.service';
import { DonationRepository } from './repositories/donation.repository';
import { PrismaModule } from '@/config/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DonationController],
  providers: [DonationService, DonationRepository],
})
export class DonationModule {}
