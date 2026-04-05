import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { DashboardService } from './dashboard.service';
import {
  DASHBOARD_PERIODS,
  DashboardOverviewQueryDto,
} from './dto/dashboard-overview-query.dto';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Obter visão geral agregada do dashboard' })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: DASHBOARD_PERIODS,
    description: 'Período usado nas séries temporais',
  })
  @ApiResponse({
    status: 200,
    description: 'Indicadores do dashboard retornados com sucesso',
  })
  getOverview(@Query() query: DashboardOverviewQueryDto) {
    return this.dashboardService.getOverview(query.period ?? 'year');
  }
}
