import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ResourcesService } from '../services/resources.service';
import { RolesResponseDto } from '../dtos/roles-response.dto';
import { EventStatusResponseDto } from '../dtos/event-status-response.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorator/roles.decorator';
import { EmployeeRole } from '@/modules/employee/enums/role.enum';
import { LoggedUser } from '@/common/decorator/user.decorator';
import { Employee } from '@prisma/client';

@ApiTags('Resources')
@Controller('resources')
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(EmployeeRole.ADMIN, EmployeeRole.MANAGER)
  @Get('roles')
  @ApiOperation({ summary: 'Listar todas as roles disponíveis' })
  @ApiOkResponse({
    description: 'Lista de roles retornada com sucesso',
    type: RolesResponseDto,
  })
  getRoles(@LoggedUser() employee: Employee): RolesResponseDto {
    return this.resourcesService.getRoles(employee.role);
  }

  @Get('event-status')
  @ApiOperation({ summary: 'Listar todos os status de eventos disponíveis' })
  @ApiOkResponse({
    description: 'Lista de status de eventos retornada com sucesso',
    type: EventStatusResponseDto,
  })
  getEventStatus(): EventStatusResponseDto {
    return this.resourcesService.getEventStatus();
  }
}
