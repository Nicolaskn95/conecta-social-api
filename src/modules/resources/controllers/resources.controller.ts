import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { ResourcesService } from '../services/resources.service';
import { RolesResponseDto } from '../dtos/roles-response.dto';
import { EventStatusResponseDto } from '../dtos/event-status-response.dto';

@ApiTags('Resources')
@Controller('resources')
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Get('roles')
  @ApiOperation({ summary: 'Listar todas as roles disponíveis' })
  @ApiOkResponse({
    description: 'Lista de roles retornada com sucesso',
    type: RolesResponseDto,
  })
  getRoles(): RolesResponseDto {
    return this.resourcesService.getRoles();
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
