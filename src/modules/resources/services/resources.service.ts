import { Injectable } from '@nestjs/common';
import { EmployeeRole, EventStatus } from '@prisma/client';
import { RolesResponseDto } from '../dtos/roles-response.dto';
import { EventStatusResponseDto } from '../dtos/event-status-response.dto';

@Injectable()
export class ResourcesService {
  getRoles(): RolesResponseDto {
    const roles = [
      {
        label: 'Administrador',
        value: EmployeeRole.ADMIN,
      },
      {
        label: 'Gerente',
        value: EmployeeRole.MANAGER,
      },
      {
        label: 'Voluntário',
        value: EmployeeRole.VOLUNTEER,
      },
    ];

    return { roles };
  }

  getEventStatus(): EventStatusResponseDto {
    const status = [
      {
        label: 'Concluído',
        value: EventStatus.COMPLETED,
      },
      {
        label: 'Aberto',
        value: EventStatus.SCHEDULED,
      },
      {
        label: 'Cancelado',
        value: EventStatus.CANCELED,
      },
    ];

    return { status };
  }
}
