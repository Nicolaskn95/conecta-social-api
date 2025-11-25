import { Injectable } from '@nestjs/common';
import { CreateDonationDto } from '../dtos/create-donation.dto';
import { UpdateDonationDto } from '../dtos/update-donation.dto';
import { PrismaService } from '@/config/prisma/prisma.service';

@Injectable()
export class DonationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateDonationDto) {
    return this.prisma.donation.create({
      data: {
        ...data,
        current_quantity: data.initial_quantity,
      },
      include: {
        category: true,
      },
    });
  }

  async findAll() {
    return this.prisma.donation.findMany({
      where: { active: true },
      include: {
        category: true,
      },
    });
  }

  async findAllActives() {
    return this.prisma.donation.findMany({
      where: { active: true },
      include: {
        category: true,
      },
    });
  }

  async findById(id: string) {
    return this.prisma.donation.findFirst({
      where: { id, active: true },
      include: {
        category: true,
      },
    });
  }

  async update(id: string, data: UpdateDonationDto) {
    return this.prisma.donation.update({
      where: { id },
      data,
      include: {
        category: true,
      },
    });
  }

  async delete(id: string) {
    await this.prisma.donation.update({
      where: { id },
      data: { active: false },
    });
  }

  async findPaginated(skip: number, take: number) {
    return this.prisma.donation.findMany({
      where: { active: true },
      orderBy: { created_at: 'desc' },
      include: { category: true },
      skip,
      take,
    });
  }

  async countActives() {
    return this.prisma.donation.count({ where: { active: true } });
  }
}
