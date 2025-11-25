import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DonationRepository } from '../repositories/donation.repository';
import { CreateDonationDto } from '../dtos/create-donation.dto';
import { UpdateDonationDto } from '../dtos/update-donation.dto';

@Injectable()
export class DonationService {
  constructor(private readonly donationRepository: DonationRepository) {}

  async create(createDonationDto: CreateDonationDto) {
    if (createDonationDto.initial_quantity <= 0) {
      throw new BadRequestException(
        'A quantidade inicial deve ser maior que zero'
      );
    }
    return this.donationRepository.create(createDonationDto);
  }

  async findAll() {
    return this.donationRepository.findAll();
  }

  async findAllActives() {
    return this.donationRepository.findAllActives();
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
      list: donations,
    };
  }

  async findById(id: string) {
    const donation = await this.donationRepository.findById(id);
    if (!donation) {
      throw new NotFoundException('Doação não encontrada');
    }
    return donation;
  }

  async update(id: string, updateDonationDto: UpdateDonationDto) {
    await this.findById(id);
    return this.donationRepository.update(id, updateDonationDto);
  }

  async delete(id: string) {
    await this.findById(id);
    await this.donationRepository.delete(id);
  }
}
