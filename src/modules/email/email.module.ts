import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { InlineTemplateService } from './inline-template.service';

@Module({
  providers: [EmailService, InlineTemplateService],
  exports: [EmailService, InlineTemplateService],
})
export class EmailModule {}
