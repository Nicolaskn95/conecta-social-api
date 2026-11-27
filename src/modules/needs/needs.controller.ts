import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { LoggedUser } from '@/common/decorator/user.decorator';
import { Roles } from '@/common/decorator/roles.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Employee } from '@/domain/entities';
import { EmployeeRole } from '@/domain/enums';
import {
  ItemTypesQueryDto,
  NeedComplementsDto,
  NeedsQueryDto,
  UpdateNeedDto,
} from './needs.dto';
import { NeedsService } from './needs.service';

@ApiTags('Necessidades')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(EmployeeRole.ADMIN, EmployeeRole.MANAGER, EmployeeRole.VOLUNTEER)
@Controller()
export class NeedsController {
  constructor(private readonly needs: NeedsService) {}

  @Get('item-types')
  listItemTypes(@Query() query: ItemTypesQueryDto) {
    return this.needs.listItemTypes(query);
  }

  @Post('families/:id/needs')
  @ApiResponse({ status: 201, description: 'Necessidade registrada.' })
  @ApiResponse({
    status: 200,
    description: 'Cadastro sem complementos, com data: null.',
  })
  async createForFamily(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: NeedComplementsDto,
    @LoggedUser() actor: Employee,
    @Res({ passthrough: true }) response: Response
  ) {
    const need = await this.needs.createForFamily(id, body ?? {}, actor);
    if (!need) response.status(200);
    return need;
  }

  @Post('beneficiaries/:id/needs')
  @ApiResponse({ status: 201, description: 'Necessidade registrada.' })
  @ApiResponse({
    status: 200,
    description: 'Cadastro sem complementos, com data: null.',
  })
  async createForBeneficiary(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: NeedComplementsDto,
    @LoggedUser() actor: Employee,
    @Res({ passthrough: true }) response: Response
  ) {
    const need = await this.needs.createForBeneficiary(id, body ?? {}, actor);
    if (!need) response.status(200);
    return need;
  }

  @Get('needs')
  list(@Query() query: NeedsQueryDto) {
    return this.needs.list(query);
  }

  @Get('needs/:id')
  detail(@Param('id', ParseUUIDPipe) id: string) {
    return this.needs.detail(id);
  }

  @Put('needs/:id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateNeedDto,
    @LoggedUser() actor: Employee
  ) {
    return this.needs.update(id, body ?? {}, actor);
  }
}
