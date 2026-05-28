import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { DonationRepository } from '../repositories/donation.repository';
import { CreateDonationDto } from '../dtos/create-donation.dto';
import { UpdateDonationDto } from '../dtos/update-donation.dto';
import { CreateDonationStockAdjustmentDto } from '../dtos/create-donation-stock-adjustment.dto';
import {
  DonationImageMetadata,
  DonationImageService,
} from './donation-image.service';
import {
  DonationStockAdjustmentReason,
  Employee,
  EmployeeRole,
} from '@prisma/client';
import { PrismaService } from '@/config/prisma/prisma.service';

type DonationWithImage = {
  image_key?: string | null;
  image_bucket?: string | null;
};

@Injectable()
export class DonationService {
  constructor(
    private readonly donationRepository: DonationRepository,
    private readonly donationImageService: DonationImageService,
    private readonly prisma: PrismaService
  ) {}

  async create(
    createDonationDto: CreateDonationDto,
    image?: Express.Multer.File
  ) {
    if (createDonationDto.initial_quantity <= 0) {
      throw new BadRequestException(
        'A quantidade inicial deve ser maior que zero'
      );
    }

    const imageMetadata = await this.uploadImageIfPresent(image);
    const donation = await this.donationRepository.create({
      ...createDonationDto,
      ...imageMetadata,
    });

    return this.withSignedImageUrl(donation);
  }

  async findAll() {
    const donations = await this.donationRepository.findAll();
    return this.withSignedImageUrls(donations);
  }

  async findAllActives() {
    const donations = await this.donationRepository.findAllActives();
    return this.withSignedImageUrls(donations);
  }

  async findAllWithStock() {
    const donations = await this.donationRepository.findAllWithStock();
    return this.withSignedImageUrls(donations);
  }

  async findAllPaginated(page = 1, size = 10) {
    const skip = (page - 1) * size;

    const [donations, total] = await Promise.all([
      this.donationRepository.findPaginated(skip, size),
      this.donationRepository.countActives(),
    ]);

    const totalPages = Math.ceil(total / size);
    const isLastPage = page >= totalPages;

    return {
      page,
      next_page: isLastPage ? page : page + 1,
      is_last_page: isLastPage,
      previous_page: page > 1 ? page - 1 : 1,
      total_pages: totalPages,
      list: await this.withSignedImageUrls(donations),
    };
  }

  async findById(id: string) {
    const donation = await this.getActiveDonationOrThrow(id);
    return this.withSignedImageUrl(donation);
  }

  async update(
    id: string,
    updateDonationDto: UpdateDonationDto,
    image?: Express.Multer.File,
    actor?: Employee
  ) {
    await this.getActiveDonationOrThrow(id);

    if (
      actor?.role === EmployeeRole.VOLUNTEER &&
      updateDonationDto.active !== undefined
    ) {
      throw new ForbiddenException(
        'Voluntários não podem desativar ou reativar doações.'
      );
    }

    const imageMetadata = await this.uploadImageIfPresent(image);
    const donation = await this.donationRepository.update(id, {
      ...updateDonationDto,
      ...imageMetadata,
    });

    return this.withSignedImageUrl(donation);
  }

  async adjustStock(
    id: string,
    dto: CreateDonationStockAdjustmentDto,
    actor: Employee
  ) {
    if (!actor?.id) {
      throw new ForbiddenException(
        'Usuário autenticado não encontrado para registrar o ajuste.'
      );
    }

    if (
      actor.role !== EmployeeRole.ADMIN &&
      actor.role !== EmployeeRole.MANAGER
    ) {
      throw new ForbiddenException(
        'Apenas ADMIN e MANAGER podem ajustar estoque.'
      );
    }

    if (dto.delta_quantity === 0) {
      throw new BadRequestException(
        'O delta de estoque deve ser diferente de zero.'
      );
    }

    const normalizedNote = dto.note?.trim();
    if (
      dto.reason === DonationStockAdjustmentReason.OTHER &&
      !normalizedNote
    ) {
      throw new BadRequestException(
        'A observação é obrigatória quando o motivo for OTHER.'
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const donation = await tx.donation.findFirst({
        where: { id, active: true },
        include: { category: true },
      });

      if (!donation) {
        throw new NotFoundException('Doação não encontrada');
      }

      const newQuantity = donation.current_quantity + dto.delta_quantity;
      if (newQuantity < 0) {
        throw new BadRequestException(
          'O ajuste informado deixaria o estoque negativo.'
        );
      }

      const updatedDonation = await tx.donation.update({
        where: { id: donation.id },
        data: {
          current_quantity: newQuantity,
          available: newQuantity > 0,
        },
        include: {
          category: true,
        },
      });

      const adjustment = await tx.donationStockAdjustment.create({
        data: {
          id_donation: donation.id,
          id_employee: actor.id,
          delta_quantity: dto.delta_quantity,
          previous_quantity: donation.current_quantity,
          new_quantity: newQuantity,
          reason: dto.reason,
          note: normalizedNote ?? null,
        },
      });

      return {
        adjustment,
        donation: updatedDonation,
      };
    });

    return {
      adjustment: result.adjustment,
      donation: await this.withSignedImageUrl(result.donation),
    };
  }

  async findStockAdjustments(id: string) {
    await this.getActiveDonationOrThrow(id);

    return this.prisma.donationStockAdjustment.findMany({
      where: {
        id_donation: id,
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            surname: true,
            role: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  async delete(id: string) {
    await this.getActiveDonationOrThrow(id);
    await this.donationRepository.delete(id);
  }

  private async getActiveDonationOrThrow(id: string) {
    const donation = await this.donationRepository.findById(id);

    if (!donation) {
      throw new NotFoundException('Doação não encontrada');
    }

    return donation;
  }

  private async uploadImageIfPresent(
    image?: Express.Multer.File
  ): Promise<Partial<DonationImageMetadata>> {
    if (!image) {
      return {};
    }

    return this.donationImageService.upload(image);
  }

  private async withSignedImageUrls<T extends DonationWithImage>(
    donations: T[]
  ) {
    return Promise.all(
      donations.map((donation) => this.withSignedImageUrl(donation))
    );
  }

  private async withSignedImageUrl<T extends DonationWithImage>(donation: T) {
    const imageUrl =
      await this.donationImageService.getSignedImageUrl(donation);

    if (!imageUrl) {
      return donation;
    }

    return {
      ...donation,
      image_url: imageUrl,
    };
  }
}
