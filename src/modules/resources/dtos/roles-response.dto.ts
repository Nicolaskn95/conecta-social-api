import { ApiProperty } from '@nestjs/swagger';
import { EmployeeRole } from '@prisma/client';

class RoleItemDto {
  @ApiProperty({ example: 'Administrador', description: 'Label da role' })
  label: string;

  @ApiProperty({
    enum: EmployeeRole,
    example: EmployeeRole.ADMIN,
    description: 'Valor da role',
  })
  value: EmployeeRole;
}

export class RolesResponseDto {
  @ApiProperty({
    type: [RoleItemDto],
    description: 'Lista de roles disponíveis',
  })
  roles: RoleItemDto[];
}
