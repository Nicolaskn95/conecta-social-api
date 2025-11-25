import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
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

  @Get('paginated')
  @ApiOperation({ summary: 'Listar doações com paginação' })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada de doações ativas',
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
    @Query('size') size?: string
  ) {
    const pageNumber = page ? parseInt(page, 10) : 1;
    const pageSize = size ? parseInt(size, 10) : 10;
    return this.donationService.findAllPaginated(pageNumber, pageSize);
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
