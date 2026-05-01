import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DonationRepository } from '../repositories/donation.repository';
import { CreateDonationDto } from '../dtos/create-donation.dto';
import { UpdateDonationDto } from '../dtos/update-donation.dto';
import {
  DonationImageMetadata,
  DonationImageService,
} from './donation-image.service';

type DonationWithImage = {
  image_key?: string | null;
  image_bucket?: string | null;
};

@Injectable()
export class DonationService {
  constructor(
    private readonly donationRepository: DonationRepository,
    private readonly donationImageService: DonationImageService
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
    image?: Express.Multer.File
  ) {
    await this.getActiveDonationOrThrow(id);

    const imageMetadata = await this.uploadImageIfPresent(image);
    const donation = await this.donationRepository.update(id, {
      ...updateDonationDto,
      ...imageMetadata,
    });

    return this.withSignedImageUrl(donation);
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
