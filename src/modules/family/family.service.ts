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
