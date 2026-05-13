import { ApiProperty } from '@nestjs/swagger';
import { EventStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateEventStatusDto {
  @ApiProperty({
    enum: EventStatus,
    example: EventStatus.COMPLETED,
    description: 'Novo status do evento',
  })
  @IsEnum(EventStatus)
  status: EventStatus;
}
