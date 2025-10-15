import { Module } from '@nestjs/common';
import { PasswordResetService } from './password-reset.service';
import { PasswordResetController } from './password-reset.controller';
import { EmailModule } from '../email/email.module';
import { PrismaService } from '@/config/prisma/prisma.service';

@Module({
  imports: [EmailModule],
  controllers: [PasswordResetController],
  providers: [PasswordResetService, PrismaService],
})
export class PasswordResetModule {}
