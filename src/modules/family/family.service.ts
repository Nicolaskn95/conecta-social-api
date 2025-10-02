import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/config/prisma/prisma.service';
import { CreateFamilyDto } from './dto/create-family.dto';
import { UpdateFamilyDto } from './dto/update-family.dto';

@Injectable()
export class FamilyService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateFamilyDto) {
    return this.prisma.family.create({
      data: {
        ...dto,
        active: dto.active ?? true,
      },
    });
  }

  findAll() {
    return this.prisma.family.findMany();
  }

  findAllActives() {
    return this.prisma.family.findMany({
      where: { active: true },
    });
  }

  async findOne(id: string) {
    const family = await this.prisma.family.findUnique({ where: { id } });

    if (!family) {
      throw new NotFoundException('Família não encontrada');
    }

    return family;
  }

  async update(id: string, dto: UpdateFamilyDto) {
    await this.findOne(id);

    return this.prisma.family.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.family.update({
      where: { id },
      data: { active: false },
    });
  }
}
