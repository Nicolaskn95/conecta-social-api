import { ApiProperty } from '@nestjs/swagger';
import { EmployeeRole } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateEmployeeRoleDto {
  @ApiProperty({
    enum: EmployeeRole,
    example: EmployeeRole.VOLUNTEER,
    description: 'Novo papel do funcionário no sistema',
  })
  @IsEnum(EmployeeRole)
  role: EmployeeRole;
}
