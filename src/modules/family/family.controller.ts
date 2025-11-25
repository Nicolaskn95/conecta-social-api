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
import { FamilyService } from './family.service';
import { CreateFamilyDto } from './dto/create-family.dto';
import { UpdateFamilyDto } from './dto/update-family.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

@ApiTags('Families')
@Controller('families')
export class FamilyController {
  constructor(private readonly familyService: FamilyService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Criar nova família' })
  @ApiResponse({ status: 201, description: 'Família criada com sucesso' })
  create(@Body() dto: CreateFamilyDto) {
    return this.familyService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get()
  @ApiOperation({ summary: 'Listar famílias ativas' })
  @ApiResponse({ status: 200, description: 'Lista de famílias ativas' })
  findAllActives() {
    return this.familyService.findAllActives();
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('paginated')
  @ApiOperation({ summary: 'Listar famílias com paginação' })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada de famílias ativas',
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
    return this.familyService.findAllPaginated(pageNumber, pageSize);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('all')
  @ApiOperation({ summary: 'Listar todas as famílias' })
  @ApiResponse({ status: 200, description: 'Lista de famílias' })
  findAll() {
    return this.familyService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(':id')
  @ApiOperation({ summary: 'Buscar família por ID' })
  @ApiResponse({ status: 200, description: 'Família encontrada' })
  @ApiResponse({ status: 404, description: 'Família não encontrada' })
  findOne(@Param('id') id: string) {
    return this.familyService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Put(':id')
  @ApiOperation({ summary: 'Atualizar família' })
  @ApiResponse({ status: 200, description: 'Família atualizada com sucesso' })
  update(@Param('id') id: string, @Body() dto: UpdateFamilyDto) {
    return this.familyService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete(':id')
  @ApiOperation({ summary: 'Desativar família' })
  @ApiResponse({ status: 200, description: 'Família desativada com sucesso' })
  remove(@Param('id') id: string) {
    return this.familyService.remove(id);
  }
}
