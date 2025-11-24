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
