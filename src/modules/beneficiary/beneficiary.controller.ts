import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Employee } from '@prisma/client';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorator/roles.decorator';
import { LoggedUser } from '@/common/decorator/user.decorator';
import { EmployeeRole } from '@/modules/employee/enums/role.enum';
import {
  BeneficiaryPaginatedQueryDto,
  BeneficiaryQueryDto,
} from './dto/beneficiary-query.dto';
import { CreateBeneficiaryDto } from './dto/create-beneficiary.dto';
import { DisabilitySuggestionsQueryDto } from './dto/disability-suggestions-query.dto';
import { UpdateBeneficiaryDto } from './dto/update-beneficiary.dto';
import { BeneficiaryService } from './beneficiary.service';

@ApiTags('Beneficiaries')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('beneficiaries')
export class BeneficiaryController {
  constructor(private readonly beneficiaryService: BeneficiaryService) {}

  @Post()
  @Roles(EmployeeRole.ADMIN, EmployeeRole.MANAGER, EmployeeRole.VOLUNTEER)
  @ApiOperation({ summary: 'Criar beneficiário' })
  @ApiResponse({ status: 201, description: 'Beneficiário criado com sucesso.' })
  create(@Body() dto: CreateBeneficiaryDto, @LoggedUser() employee?: Employee) {
    return this.beneficiaryService.create(dto, employee);
  }

  @Get()
  @Roles(EmployeeRole.ADMIN, EmployeeRole.MANAGER, EmployeeRole.VOLUNTEER)
  @ApiOperation({ summary: 'Listar beneficiários ativos com filtros opcionais' })
  @ApiResponse({ status: 200, description: 'Lista de beneficiários.' })
  findAll(@Query() query: BeneficiaryQueryDto) {
    return this.beneficiaryService.findAll(query);
  }

  @Get('paginated')
  @Roles(EmployeeRole.ADMIN, EmployeeRole.MANAGER, EmployeeRole.VOLUNTEER)
  @ApiOperation({ summary: 'Listar beneficiários com paginação' })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada de beneficiários.',
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
  findAllPaginated(@Query() query: BeneficiaryPaginatedQueryDto) {
    return this.beneficiaryService.findAllPaginated(query);
  }

  @Get('disability-suggestions')
  @Roles(EmployeeRole.ADMIN, EmployeeRole.MANAGER, EmployeeRole.VOLUNTEER)
  @ApiOperation({ summary: 'Buscar sugestões de deficiência cadastradas' })
  @ApiResponse({ status: 200, description: 'Lista de sugestões de deficiência.' })
  findDisabilitySuggestions(@Query() query: DisabilitySuggestionsQueryDto) {
    return this.beneficiaryService.findDisabilitySuggestions(query);
  }

  @Get(':id')
  @Roles(EmployeeRole.ADMIN, EmployeeRole.MANAGER, EmployeeRole.VOLUNTEER)
  @ApiOperation({ summary: 'Buscar beneficiário por ID' })
  @ApiResponse({ status: 200, description: 'Beneficiário encontrado.' })
  @ApiResponse({ status: 404, description: 'Beneficiário não encontrado.' })
  findOne(@Param('id') id: string) {
    return this.beneficiaryService.findOne(id);
  }

  @Put(':id')
  @Roles(EmployeeRole.ADMIN, EmployeeRole.MANAGER, EmployeeRole.VOLUNTEER)
  @ApiOperation({ summary: 'Atualizar beneficiário' })
  @ApiResponse({ status: 200, description: 'Beneficiário atualizado com sucesso.' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateBeneficiaryDto,
    @LoggedUser() employee?: Employee
  ) {
    return this.beneficiaryService.update(id, dto, employee);
  }

  @Delete(':id')
  @Roles(EmployeeRole.ADMIN, EmployeeRole.MANAGER)
  @ApiOperation({ summary: 'Desativar beneficiário' })
  @ApiResponse({ status: 200, description: 'Beneficiário desativado com sucesso.' })
  remove(@Param('id') id: string, @LoggedUser() employee?: Employee) {
    return this.beneficiaryService.remove(id, employee);
  }
}
