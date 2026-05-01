import { Injectable } from '@nestjs/common';
import { CreateDonationDto } from '../dtos/create-donation.dto';
import { UpdateDonationDto } from '../dtos/update-donation.dto';
import { PrismaService } from '@/config/prisma/prisma.service';

interface DonationImageFields {
  image_key?: string;
  image_bucket?: string;
  image_content_type?: string;
  image_original_name?: string;
}

type CreateDonationData = CreateDonationDto & Partial<DonationImageFields>;
type UpdateDonationData = UpdateDonationDto & Partial<DonationImageFields>;

@Injectable()
export class DonationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateDonationData) {
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

  async update(id: string, data: UpdateDonationData) {
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
