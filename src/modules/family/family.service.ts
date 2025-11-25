import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateFamilyDto } from './dto/create-family.dto';
import { UpdateFamilyDto } from './dto/update-family.dto';
import { FamilyRepositoryImpl } from './repositories/family.repository.impl';

@Injectable()
export class FamilyService {
  constructor(private familyRepository: FamilyRepositoryImpl) {}

  create(dto: CreateFamilyDto) {
    return this.familyRepository.create(dto);
  }

  findAll() {
    return this.familyRepository.findAll();
  }

  findAllActives() {
    return this.familyRepository.findAllActives();
  }

  async findAllPaginated(page = 1, size = 10) {
    const skip = (page - 1) * size;

    try {
      const [families, total] = await Promise.all([
        this.familyRepository.findPaginated(skip, size),
        this.familyRepository.countActives(),
      ]);

      const totalPages = Math.ceil(total / size);
      const isLastPage = page >= totalPages;

      return {
        page,
        next_page: isLastPage ? page : page + 1,
        is_last_page: isLastPage,
        previous_page: page > 1 ? page - 1 : 1,
        total_pages: totalPages,
        list: families,
      };
    } catch (error) {
      throw error;
    }
  }

  async findOne(id: string) {
    const family = await this.familyRepository.findById(id);
    if (!family) {
      throw new NotFoundException('Família não encontrada');
    }
    return family;
  }

  async update(id: string, dto: UpdateFamilyDto) {
    await this.findOne(id);
    return this.familyRepository.update(id, dto);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.familyRepository.softDelete(id);
  }
}
