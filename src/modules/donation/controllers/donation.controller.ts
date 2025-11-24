import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DonationService } from '../services/donation.service';
import { CreateDonationDto } from '../dtos/create-donation.dto';
import { UpdateDonationDto } from '../dtos/update-donation.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

@ApiTags('Donations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('donations')
export class DonationController {
  constructor(private readonly donationService: DonationService) {}

  @Post()
  @ApiOperation({ summary: 'Criar uma nova doação' })
  @ApiResponse({ status: 201, description: 'Doação criada com sucesso' })
  create(@Body() createDonationDto: CreateDonationDto) {
    return this.donationService.create(createDonationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as doações ativas' })
  @ApiResponse({ status: 200, description: 'Lista de doações ativas' })
  findAllActives() {
    return this.donationService.findAllActives();
  }

  @Get('all')
  @ApiOperation({ summary: 'Listar todas as doações' })
  @ApiResponse({ status: 200, description: 'Lista de doações' })
  findAll() {
    return this.donationService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar uma doação pelo ID' })
  findById(@Param('id') id: string) {
    return this.donationService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar uma doação' })
  update(
    @Param('id') id: string,
    @Body() updateDonationDto: UpdateDonationDto
  ) {
    return this.donationService.update(id, updateDonationDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deletar uma doação' })
  delete(@Param('id') id: string) {
    return this.donationService.delete(id);
  }
}
