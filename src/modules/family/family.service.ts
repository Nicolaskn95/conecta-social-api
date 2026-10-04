import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditActionType, AuditEntityType } from '@/domain/enums';
import { Employee } from '@/domain/entities';
import { FamilyRepository } from '@/domain/repositories';
import { CreateFamilyDto } from './dto/create-family.dto';
import { UpdateFamilyDto } from './dto/update-family.dto';
import { AuditLogService } from '@/modules/audit-log/audit-log.service';

@Injectable()
export class FamilyService {
  constructor(
    private readonly familyRepository: FamilyRepository,
    private readonly auditLogService: AuditLogService
  ) {}

  async create(dto: CreateFamilyDto, actor?: Employee) {
    const { active: _active, ...data } = dto;
    const family = await this.familyRepository.create(data);

    await this.auditLogService.write({
      entityType: AuditEntityType.FAMILY,
      entityId: family.id,
      actionType: AuditActionType.CREATE,
      actor,
      message: 'Família criada.',
      metadata: {
        name: family.name,
        city: family.city,
      },
    });

    return family;
  }

  findAll() {
    return this.familyRepository.findAll();
  }

  findAllActives() {
    return this.familyRepository.findAllActives();
  }

  async findAllPaginated(page = 1, size = 10) {
    const skip = (page - 1) * size;

    try {
      const [families, total] = await Promise.all([
        this.familyRepository.findPaginated(skip, size),
        this.familyRepository.countActives(),
      ]);

      const totalPages = Math.ceil(total / size);
      const isLastPage = page >= totalPages;

      return {
        page,
        next_page: isLastPage ? page : page + 1,
        is_last_page: isLastPage,
        previous_page: page > 1 ? page - 1 : 1,
        total_pages: totalPages,
        list: families,
      };
    } catch (error) {
      throw error;
    }
  }

  async findOne(id: string) {
    const family = await this.familyRepository.findById(id);
    if (!family) {
      throw new NotFoundException('Família não encontrada');
    }
    return family;
  }

  async update(id: string, dto: UpdateFamilyDto, actor?: Employee) {
    await this.findOne(id);
    const { active: _active, ...data } = dto;
    const family = await this.familyRepository.update(id, data);

    await this.auditLogService.write({
      entityType: AuditEntityType.FAMILY,
      entityId: id,
      actionType: AuditActionType.UPDATE,
      actor,
      message: 'Família atualizada.',
      metadata: {
        updated_fields: Object.keys(data),
      },
    });

    return family;
  }

  async remove(id: string, actor?: Employee) {
    await this.findOne(id);
    const family = await this.familyRepository.softDelete(id);

    await this.auditLogService.write({
      entityType: AuditEntityType.FAMILY,
      entityId: id,
      actionType: AuditActionType.SOFT_DELETE,
      actor,
      message: 'Família desativada.',
    });

    return family;
  }
}
