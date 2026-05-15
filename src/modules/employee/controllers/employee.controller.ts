import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Patch,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { EmployeeService } from '../services/employee.service';
import { CreateEmployeeDto } from '../dtos/create-employee.dto';
import { UpdateEmployeeBasicDto } from '../dtos/update-employee-basic.dto';
import { UpdateEmployeeRoleDto } from '../dtos/update-employee-role.dto';
import { UpdateEmployeePasswordDto } from '../dtos/update-employee-password.dto';
import { UpdateOwnPasswordDto } from '../dtos/update-own-password.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorator/roles.decorator';
import { LoggedUser } from '@/common/decorator/user.decorator';
import { EmployeeRole } from '../enums/role.enum';
import { Employee } from '@prisma/client';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

@ApiTags('Employees')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('employees')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(EmployeeRole.ADMIN, EmployeeRole.MANAGER)
  @Post()
  @ApiOperation({ summary: 'Criar um novo funcionário' })
  @ApiResponse({ status: 201, description: 'Funcionário criado com sucesso' })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado (nível de permissão insuficiente)',
  })
  create(@Body() dto: CreateEmployeeDto, @LoggedUser() employee: Employee) {
    return this.employeeService.create(dto, employee);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(EmployeeRole.ADMIN, EmployeeRole.MANAGER)
  @Get()
  @ApiOperation({ summary: 'Listar funcionários ativos' })
  @ApiResponse({ status: 200, description: 'Lista de funcionários ativos' })
  findAllActives(@LoggedUser() employee: Employee) {
    return this.employeeService.findAllActives(employee);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(EmployeeRole.ADMIN, EmployeeRole.MANAGER)
  @Get('paginated')
  @ApiOperation({ summary: 'Listar funcionários com paginação' })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada de funcionários',
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
  findAllPaginated(
    @Query('page') page?: string,
    @Query('size') size?: string,
    @LoggedUser() employee?: Employee
  ) {
    const pageNumber = page ? parseInt(page, 10) : 1;
    const pageSize = size ? parseInt(size, 10) : 10;
    return this.employeeService.findAllPaginated(
      pageNumber,
      pageSize,
      employee
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(EmployeeRole.ADMIN, EmployeeRole.MANAGER)
  @Get('all')
  @ApiOperation({ summary: 'Listar todos os funcionários' })
  @ApiResponse({ status: 200, description: 'Lista de funcionários' })
  findAll(@LoggedUser() employee: Employee) {
    return this.employeeService.findAll(employee);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@LoggedUser() employee: Employee) {
    const { password: _password, ...safeEmployee } = employee;
    return safeEmployee;
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  @ApiOperation({ summary: 'Atualizar o próprio perfil' })
  updateOwnProfile(
    @LoggedUser() employee: Employee,
    @Body() dto: UpdateEmployeeBasicDto
  ) {
    return this.employeeService.updateOwnProfile(employee, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/password')
  @ApiOperation({ summary: 'Alterar a própria senha' })
  updateOwnPassword(
    @LoggedUser() employee: Employee,
    @Body() dto: UpdateOwnPasswordDto
  ) {
    return this.employeeService.updateOwnPassword(
      employee,
      dto.current_password,
      dto.new_password
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(EmployeeRole.ADMIN, EmployeeRole.MANAGER)
  @Get(':id')
  @ApiOperation({ summary: 'Buscar funcionário por ID' })
  findOne(@Param('id') id: string, @LoggedUser() employee: Employee) {
    return this.employeeService.findOne(id, employee);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(EmployeeRole.ADMIN, EmployeeRole.MANAGER)
  @Put(':id/basic')
  @ApiOperation({ summary: 'Atualizar dados básicos de funcionário' })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado (nível de permissão insuficiente)',
  })
  updateBasic(
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeBasicDto,
    @LoggedUser() employee: Employee
  ) {
    return this.employeeService.updateBasic(id, dto, employee);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(EmployeeRole.ADMIN, EmployeeRole.MANAGER)
  @Put(':id')
  @ApiOperation({ summary: 'Atualizar dados básicos de funcionário' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeBasicDto,
    @LoggedUser() employee: Employee
  ) {
    return this.employeeService.updateBasic(id, dto, employee);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(EmployeeRole.ADMIN)
  @Patch(':id/role')
  @ApiOperation({ summary: 'Alterar nível de acesso de funcionário' })
  updateRole(@Param('id') id: string, @Body() dto: UpdateEmployeeRoleDto) {
    return this.employeeService.updateRole(id, dto.role);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(EmployeeRole.ADMIN)
  @Patch(':id/password')
  @ApiOperation({ summary: 'Alterar senha de outro funcionário' })
  updatePassword(
    @Param('id') id: string,
    @Body() dto: UpdateEmployeePasswordDto
  ) {
    return this.employeeService.updatePassword(id, dto.password);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(EmployeeRole.ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Desativar funcionário (soft delete)' })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado (nível de permissão insuficiente)',
  })
  remove(@Param('id') id: string) {
    return this.employeeService.remove(id);
  }
}
