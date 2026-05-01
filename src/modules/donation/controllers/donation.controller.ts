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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { DonationService } from '../services/donation.service';
import { CreateDonationDto } from '../dtos/create-donation.dto';
import { UpdateDonationDto } from '../dtos/update-donation.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

const DONATION_IMAGE_MAX_SIZE_BYTES = 10 * 1024 * 1024;

@ApiTags('Donations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('donations')
export class DonationController {
  constructor(private readonly donationService: DonationService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('image', {
      limits: { fileSize: DONATION_IMAGE_MAX_SIZE_BYTES },
    })
  )
  @ApiConsumes('application/json', 'multipart/form-data')
  @ApiOperation({ summary: 'Criar uma nova doação' })
  @ApiBody({
    description:
      'Dados da doação. Para upload de imagem, envie multipart/form-data com o campo image.',
    schema: {
      type: 'object',
      required: ['category_id', 'name', 'initial_quantity'],
      properties: {
        category_id: { type: 'string', format: 'uuid' },
        name: { type: 'string' },
        description: { type: 'string' },
        initial_quantity: { type: 'number' },
        donator_name: { type: 'string' },
        gender: { type: 'string' },
        size: { type: 'string' },
        image: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Doação criada com sucesso' })
  create(
    @Body() createDonationDto: CreateDonationDto,
    @UploadedFile() image?: Express.Multer.File
  ) {
    return this.donationService.create(createDonationDto, image);
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
  findAllPaginated(@Query('page') page?: string, @Query('size') size?: string) {
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
  @UseInterceptors(
    FileInterceptor('image', {
      limits: { fileSize: DONATION_IMAGE_MAX_SIZE_BYTES },
    })
  )
  @ApiConsumes('application/json', 'multipart/form-data')
  @ApiOperation({ summary: 'Atualizar uma doação' })
  @ApiBody({
    description:
      'Dados parciais da doação. Para trocar/adicionar imagem, envie multipart/form-data com o campo image.',
    schema: {
      type: 'object',
      properties: {
        category_id: { type: 'string', format: 'uuid' },
        name: { type: 'string' },
        description: { type: 'string' },
        initial_quantity: { type: 'number' },
        current_quantity: { type: 'number' },
        donator_name: { type: 'string' },
        gender: { type: 'string' },
        size: { type: 'string' },
        active: { type: 'boolean' },
        available: { type: 'boolean' },
        image: { type: 'string', format: 'binary' },
      },
    },
  })
  update(
    @Param('id') id: string,
    @Body() updateDonationDto: UpdateDonationDto,
    @UploadedFile() image?: Express.Multer.File
  ) {
    return this.donationService.update(id, updateDonationDto, image);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deletar uma doação' })
  delete(@Param('id') id: string) {
    return this.donationService.delete(id);
  }
}
