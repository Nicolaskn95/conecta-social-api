import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/config/prisma/prisma.service';
import { CreateDonationToFamilyDto } from './dto/create-donation-to-family.dto';

@Injectable()
export class DonationToFamilyService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDonationToFamilyDto) {
    if (dto.quantity <= 0) {
      throw new BadRequestException('A quantidade deve ser maior que zero.');
    }

    return this.prisma.$transaction(async (tx) => {
      const [donation, family] = await Promise.all([
        tx.donation.findFirst({
          where: { id: dto.id_donation, active: true },
          select: { id: true },
        }),
        tx.family.findFirst({
          where: { id: dto.id_family, active: true },
          select: { id: true },
        }),
      ]);

      if (!donation) {
        throw new NotFoundException('Doação não encontrada.');
      }

      if (!family) {
        throw new NotFoundException('Família não encontrada.');
      }

      const stockDecrementResult = await tx.donation.updateMany({
        where: {
          id: dto.id_donation,
          active: true,
          current_quantity: { gte: dto.quantity },
        },
        data: {
          current_quantity: {
            decrement: dto.quantity,
          },
        },
      });

      if (stockDecrementResult.count === 0) {
        throw new BadRequestException(
          'Estoque insuficiente para concluir esta doação.'
        );
      }

      const donationAfterUpdate = await tx.donation.findUnique({
        where: { id: dto.id_donation },
        select: { current_quantity: true },
      });

      await tx.donation.update({
        where: { id: dto.id_donation },
        data: {
          available: (donationAfterUpdate?.current_quantity ?? 0) > 0,
        },
      });

      return tx.donationToFamily.create({
        data: {
          ...dto,
        },
        include: {
          donation: {
            include: {
              category: true,
            },
          },
          family: true,
        },
      });
    });
  }

  findAllActives() {
    return this.prisma.donationToFamily.findMany({
      where: {
        active: true,
        donation: { active: true },
        family: { active: true },
      },
      include: {
        donation: {
          include: {
            category: true,
          },
        },
        family: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  findAll() {
    return this.prisma.donationToFamily.findMany({
      include: {
        donation: {
          include: {
            category: true,
          },
        },
        family: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  async findById(id: string) {
    const donationToFamily = await this.prisma.donationToFamily.findFirst({
      where: {
        id,
        active: true,
      },
      include: {
        donation: {
          include: {
            category: true,
          },
        },
        family: true,
      },
    });

    if (!donationToFamily) {
      throw new NotFoundException('Registro de doação para família não encontrado.');
    }

    return donationToFamily;
  }

  async findAllPaginated(page = 1, size = 10) {
    const skip = (page - 1) * size;
    const where = {
      active: true,
      donation: { active: true },
      family: { active: true },
    };

    const [list, total] = await Promise.all([
      this.prisma.donationToFamily.findMany({
        where,
        include: {
          donation: {
            include: {
              category: true,
            },
          },
          family: true,
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: size,
      }),
      this.prisma.donationToFamily.count({ where }),
    ]);

    const totalPages = Math.ceil(total / size);
    const isLastPage = page >= totalPages;

    return {
      page,
      next_page: isLastPage ? page : page + 1,
      is_last_page: isLastPage,
      previous_page: page > 1 ? page - 1 : 1,
      total_pages: totalPages,
      list,
    };
  }
}
