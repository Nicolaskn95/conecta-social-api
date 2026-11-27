import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorator/roles.decorator';
import { LoggedUser } from '@/common/decorator/user.decorator';
import { Employee } from '@/domain/entities';
import { EmployeeRole } from '@/domain/enums';
import { DonationToFamilyService } from './donation-to-family.service';
import { CreateDonationToFamilyDto } from './dto/create-donation-to-family.dto';
import {
  AllocationQueryDto,
  CancelAllocationDto,
  ConfirmReceiptDto,
} from './dto/allocation-operations.dto';

@ApiTags('Donations to Family')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(EmployeeRole.ADMIN, EmployeeRole.MANAGER, EmployeeRole.VOLUNTEER)
@Controller('donations-to-family')
export class DonationToFamilyController {
  constructor(private readonly service: DonationToFamilyService) {}

  @Post()
  @ApiOperation({ summary: 'Separar doação para família e baixar estoque' })
  @ApiResponse({ status: 201, description: 'Separação criada.' })
  @ApiResponse({ status: 200, description: 'Separação existente recuperada.' })
  async create(
    @Body() dto: CreateDonationToFamilyDto,
    @LoggedUser() employee: Employee,
    @Res({ passthrough: true }) response: Response
  ) {
    const { allocation, replayed } = await this.service.create(dto, employee);
    if (replayed) response.status(200);
    return allocation;
  }

  @Get()
  @ApiOperation({ summary: 'Listar registros ativos de doação para família' })
  findAllActives() {
    return this.service.findAllActives();
  }

  @Get('paginated')
  @ApiOperation({ summary: 'Listar destinações com paginação e filtros' })
  findAllPaginated(@Query() query: AllocationQueryDto) {
    return this.service.findAllPaginated(query);
  }

  @Get('all')
  @ApiOperation({ summary: 'Listar todos os registros' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar uma destinação por ID' })
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findById(id);
  }

  @Post(':id/confirm-receipt')
  @HttpCode(200)
  @ApiOperation({ summary: 'Confirmar o recebimento da doação' })
  confirm(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: ConfirmReceiptDto,
    @LoggedUser() employee: Employee
  ) {
    return this.service.confirm(id, body ?? {}, employee);
  }

  @Post(':id/cancel')
  @HttpCode(200)
  @ApiOperation({ summary: 'Cancelar a separação de uma doação' })
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: CancelAllocationDto,
    @LoggedUser() employee: Employee
  ) {
    return this.service.cancel(id, body ?? {}, employee);
  }
}
