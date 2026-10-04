import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { DonationToFamilyService } from './donation-to-family.service';
import { CreateDonationToFamilyDto } from './dto/create-donation-to-family.dto';
import { LoggedUser } from '@/common/decorator/user.decorator';
import { Employee } from '@/domain/entities';

@ApiTags('Donations to Family')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('donations-to-family')
export class DonationToFamilyController {
  constructor(
    private readonly donationToFamilyService: DonationToFamilyService
  ) { }

  @Post()
  @ApiOperation({
    summary:
      'Registrar doação para família e abater a quantidade do estoque da doação',
  })
  @ApiResponse({
    status: 201,
    description: 'Doação para família registrada com sucesso.',
  })
  create(
    @Body() dto: CreateDonationToFamilyDto,
    @LoggedUser() employee?: Employee
  ) {
    return this.donationToFamilyService.create(dto, employee);
  }

  @Get()
  @ApiOperation({ summary: 'Listar registros ativos de doação para família' })
  @ApiResponse({ status: 200, description: 'Lista de registros ativos.' })
  findAllActives() {
    return this.donationToFamilyService.findAllActives();
  }

  @Get('paginated')
  @ApiOperation({ summary: 'Listar registros com paginação' })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada de registros ativos',
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
  findAllPaginated(@Query('page') page?: string, @Query('size') size?: string) {
    const pageNumber = page ? parseInt(page, 10) : 1;
    const pageSize = size ? parseInt(size, 10) : 10;
    return this.donationToFamilyService.findAllPaginated(pageNumber, pageSize);
  }

  @Get('all')
  @ApiOperation({ summary: 'Listar todos os registros' })
  @ApiResponse({ status: 200, description: 'Lista de todos os registros.' })
  findAll() {
    return this.donationToFamilyService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar um registro por ID' })
  @ApiResponse({ status: 200, description: 'Registro encontrado.' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  findById(@Param('id') id: string) {
    return this.donationToFamilyService.findById(id);
  }
}
