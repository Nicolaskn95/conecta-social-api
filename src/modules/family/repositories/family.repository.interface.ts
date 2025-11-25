import { Family } from '@prisma/client';
import { CreateFamilyDto } from '../dto/create-family.dto';
import { UpdateFamilyDto } from '../dto/update-family.dto';

export interface FamilyRepository {
  create(dto: CreateFamilyDto): Promise<Family>;
  findAll(): Promise<Family[]>;
  findAllActives(): Promise<Family[]>;
  findById(id: string): Promise<Family | null>;
  update(id: string, data: UpdateFamilyDto): Promise<Family>;
  softDelete(id: string): Promise<Family>;
  findPaginated(skip: number, take: number): Promise<Family[]>;
  countActives(): Promise<number>;
}
