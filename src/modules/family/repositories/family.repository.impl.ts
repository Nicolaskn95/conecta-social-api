import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/config/prisma/prisma.service';
import { FamilyRepository } from './family.repository.interface';
import { CreateFamilyDto } from '../dto/create-family.dto';
import { UpdateFamilyDto } from '../dto/update-family.dto';
import { Family } from '@prisma/client';

@Injectable()
export class FamilyRepositoryImpl implements FamilyRepository {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateFamilyDto): Promise<Family> {
    return this.prisma.family.create({
      data: {
        ...dto,
        active: dto.active ?? true,
      },
    });
  }

  findAll(): Promise<Family[]> {
    return this.prisma.family.findMany();
  }

  findAllActives(): Promise<Family[]> {
    return this.prisma.family.findMany({ where: { active: true } });
  }

  findById(id: string): Promise<Family | null> {
    return this.prisma.family.findUnique({ where: { id } });
  }

  update(id: string, data: UpdateFamilyDto): Promise<Family> {
    return this.prisma.family.update({ where: { id }, data });
  }

  softDelete(id: string): Promise<Family> {
    return this.prisma.family.update({
      where: { id },
      data: { active: false },
    });
  }
}
