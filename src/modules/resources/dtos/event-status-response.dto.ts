import { ApiProperty } from '@nestjs/swagger';
import { EventStatus } from '@prisma/client';

class StatusItemDto {
  @ApiProperty({ example: 'Concluído', description: 'Label do status' })
  label: string;

  @ApiProperty({
    enum: EventStatus,
    example: 'COMPLETED',
    description: 'Valor do status',
  })
  value: EventStatus;
}

export class EventStatusResponseDto {
  @ApiProperty({
    type: [StatusItemDto],
    description: 'Lista de status de eventos disponíveis',
  })
  status: StatusItemDto[];
}
