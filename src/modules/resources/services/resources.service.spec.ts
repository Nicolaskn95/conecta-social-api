import { EmployeeRole, EventStatus } from '@prisma/client';
import { ResourcesService } from './resources.service';

describe('ResourcesService', () => {
  let service: ResourcesService;

  beforeEach(() => {
    service = new ResourcesService();
  });

  it('retorna roles com labels e valores esperados', () => {
    const result = service.getRoles();

    expect(result.roles).toEqual([
      { label: 'Administrador', value: EmployeeRole.ADMIN },
      { label: 'Gerente', value: EmployeeRole.MANAGER },
      { label: 'Voluntário', value: EmployeeRole.VOLUNTEER },
    ]);
  });

  it('retorna status de eventos com labels e valores esperados', () => {
    const result = service.getEventStatus();

    expect(result.status).toEqual([
      { label: 'Aberto', value: EventStatus.SCHEDULED },
      { label: 'Concluído', value: EventStatus.COMPLETED },
      { label: 'Cancelado', value: EventStatus.CANCELED },
    ]);
  });
});
