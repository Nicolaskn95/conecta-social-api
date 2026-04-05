import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorator/roles.decorator';
import { EmployeeRole } from '@/modules/employee/enums/role.enum';

@ApiTags('Events')
@Controller('events')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  // 🔓 Public endpoints
  @Get('upcoming')
  @ApiOperation({ summary: 'Listar próximos eventos' })
  @ApiResponse({ status: 200, description: 'Lista de eventos futuros' })
  getUpcomingEvents(@Query('limit') limit?: string) {
    const parsed = limit ? parseInt(limit, 10) : undefined;
    const take = Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
    return this.eventService.getUpcomingEvents(take);
  }

  @Get('recent')
  @ApiOperation({ summary: 'Listar eventos recentes' })
  @ApiResponse({ status: 200, description: 'Lista de eventos recentes' })
  getRecentEvents(@Query('limit') limit?: string) {
    const take = limit ? parseInt(limit, 10) : 5;
    return this.eventService.getRecentEvents(take);
  }

  @Get('recent-with-instagram')
  @ApiOperation({ summary: 'Listar eventos recentes com embed do Instagram' })
  @ApiResponse({ status: 200, description: 'Eventos com embeds do Instagram' })
  getRecentWithInstagram(@Query('limit') limit?: string) {
    const take = limit ? parseInt(limit, 10) : 5;
    return this.eventService.getRecentEventsWithInstagramEmbeds(take);
  }

  // 🔐 Protected endpoints
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(EmployeeRole.ADMIN, EmployeeRole.MANAGER)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Criar novo evento' })
  @ApiResponse({ status: 201, description: 'Evento criado com sucesso' })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado (nível de permissão insuficiente)',
  })
  create(@Body() dto: CreateEventDto) {
    return this.eventService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get()
  @ApiOperation({ summary: 'Listar todos os eventos ativos' })
  @ApiResponse({ status: 200, description: 'Eventos ativos' })
  async findAllActives() {
    return this.eventService.findAllActives();
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('all')
  @ApiOperation({ summary: 'Listar todos os eventos' })
  @ApiResponse({ status: 200, description: 'Lista de eventos' })
  findAll() {
    return this.eventService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('paginated')
  @ApiOperation({ summary: 'Listar eventos com paginação' })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada de eventos',
    schema: {
      example: {
        page: 1,
        next_page: 2,
        is_last_page: false,
        previous_page: 1,
        total_pages: 5,
        list: [],
      },
    },
  })
  async findAllPaginated(
    @Query('page') page?: string,
    @Query('size') size?: string
  ) {
    console.log('📍 Controller - findAllPaginated chamado:', { page, size });
    const pageNumber = page ? parseInt(page, 10) : 1;
    const pageSize = size ? parseInt(size, 10) : 10;
    return this.eventService.findAllPaginated(pageNumber, pageSize);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(':id')
  @ApiOperation({ summary: 'Buscar evento por ID' })
  @ApiResponse({ status: 200, description: 'Detalhes do evento encontrado' })
  @ApiResponse({ status: 404, description: 'Evento não encontrado' })
  findOne(@Param('id') id: string) {
    return this.eventService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Put(':id')
  @ApiOperation({ summary: 'Atualizar evento por ID' })
  @ApiResponse({ status: 200, description: 'Evento atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Evento não encontrado' })
  update(@Param('id') id: string, @Body() dto: UpdateEventDto) {
    return this.eventService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(EmployeeRole.ADMIN, EmployeeRole.MANAGER)
  @ApiBearerAuth()
  @Delete(':id')
  @ApiOperation({ summary: 'Desativar (soft delete) um evento' })
  @ApiResponse({ status: 200, description: 'Evento desativado com sucesso' })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado (nível de permissão insuficiente)',
  })
  @ApiResponse({ status: 404, description: 'Evento não encontrado' })
  remove(@Param('id') id: string) {
    return this.eventService.remove(id);
  }
}
