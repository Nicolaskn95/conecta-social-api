import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AuditActionType, AuditEntityType } from '@prisma/client';
import { AuditLogService } from '@/modules/audit-log/audit-log.service';
import { BeneficiaryService } from './beneficiary.service';

describe('BeneficiaryService', () => {
  let service: BeneficiaryService;
  let prisma: any;
  let auditLogService: jest.Mocked<AuditLogService>;

  beforeEach(() => {
    prisma = {
      family: {
        findFirst: jest.fn(),
      },
      beneficiary: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
    };

    auditLogService = {
      write: jest.fn(),
    } as any;

    service = new BeneficiaryService(prisma, auditLogService);
  });

  it('cria beneficiário e limpa disability_details quando has_disability for false', async () => {
    prisma.family.findFirst.mockResolvedValue({ id: 'family-1' });
    prisma.beneficiary.create.mockResolvedValue({
      id: 'beneficiary-1',
      id_family: 'family-1',
      has_disability: false,
    });
    prisma.beneficiary.findFirst.mockResolvedValue({
      id: 'beneficiary-1',
      id_family: 'family-1',
      name: 'Maria',
      surname: 'Silva',
      has_disability: false,
      disability_details: null,
      family: { id: 'family-1', name: 'Família Silva' },
    });

    const result = await service.create(
      {
        id_family: 'family-1',
        name: 'Maria',
        surname: 'Silva',
        birth_date: '1990-01-01',
        cpf: '123.456.789-01',
        rg: '1234567',
        email: 'maria@email.com',
        phone: '(11) 99999-9999',
        has_disability: false,
        disability_details: 'visual',
        gender: 'Feminino',
      },
      { id: 'employee-1', role: 'MANAGER' } as any
    );

    expect(prisma.beneficiary.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          cpf: '12345678901',
          has_disability: false,
          disability_details: null,
        }),
      })
    );

    expect(auditLogService.write).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: AuditEntityType.BENEFICIARY,
        actionType: AuditActionType.CREATE,
      })
    );

    expect(result).toEqual(
      expect.objectContaining({
        id: 'beneficiary-1',
      })
    );
  });

  it('falha ao criar quando família não existe ou está inativa', async () => {
    prisma.family.findFirst.mockResolvedValue(null);

    await expect(
      service.create({
        id_family: 'family-1',
        name: 'João',
        surname: 'Oliveira',
        birth_date: '1992-02-02',
        has_disability: false,
        gender: 'Masculino',
      } as any)
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('falha no update quando has_disability final é true sem details', async () => {
    prisma.beneficiary.findFirst.mockResolvedValue({
      id: 'beneficiary-1',
      id_family: 'family-1',
      name: 'João',
      surname: 'Silva',
      birth_date: new Date('1990-01-01'),
      cpf: null,
      rg: null,
      email: null,
      phone: null,
      has_disability: false,
      disability_details: null,
      gender: 'Masculino',
      active: true,
      family: { id: 'family-1' },
    });

    await expect(
      service.update('beneficiary-1', {
        has_disability: true,
      })
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.beneficiary.update).not.toHaveBeenCalled();
  });

  it('limpa disability_details no update quando has_disability for false', async () => {
    prisma.beneficiary.findFirst
      .mockResolvedValueOnce({
        id: 'beneficiary-1',
        id_family: 'family-1',
        name: 'João',
        surname: 'Silva',
        birth_date: new Date('1990-01-01'),
        cpf: null,
        rg: null,
        email: null,
        phone: null,
        has_disability: true,
        disability_details: 'Visual',
        gender: 'Masculino',
        active: true,
        family: { id: 'family-1' },
      })
      .mockResolvedValueOnce({
        id: 'beneficiary-1',
        id_family: 'family-1',
        name: 'João',
        surname: 'Silva',
        has_disability: false,
        disability_details: null,
        family: { id: 'family-1', name: 'Família Silva' },
      });

    prisma.beneficiary.update.mockResolvedValue({
      id: 'beneficiary-1',
      id_family: 'family-1',
      has_disability: false,
      disability_details: null,
    });

    await service.update('beneficiary-1', {
      has_disability: false,
      disability_details: 'Visual',
    });

    expect(prisma.beneficiary.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          has_disability: false,
          disability_details: null,
        }),
      })
    );
  });

  it('faz soft delete do beneficiário', async () => {
    prisma.beneficiary.findFirst.mockResolvedValue({
      id: 'beneficiary-1',
      id_family: 'family-1',
      family: { id: 'family-1' },
    });
    prisma.beneficiary.update.mockResolvedValue({
      id: 'beneficiary-1',
      active: false,
    });

    const result = await service.remove('beneficiary-1', {
      id: 'employee-1',
      role: 'ADMIN',
    } as any);

    expect(result).toEqual(
      expect.objectContaining({
        active: false,
      })
    );

    expect(auditLogService.write).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: AuditEntityType.BENEFICIARY,
        actionType: AuditActionType.SOFT_DELETE,
      })
    );
  });

  it('retorna sugestões de deficiência sem valores vazios', async () => {
    prisma.beneficiary.findMany.mockResolvedValue([
      { disability_details: 'Auditiva' },
      { disability_details: 'Visual' },
      { disability_details: '   ' },
    ]);

    const suggestions = await service.findDisabilitySuggestions({
      limit: 10,
      search: 'vi',
    });

    expect(prisma.beneficiary.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          active: true,
          has_disability: true,
        }),
      })
    );

    expect(suggestions).toEqual(['Auditiva', 'Visual']);
  });

  it('aplica filtro de ativos por padrão no findAll', async () => {
    prisma.beneficiary.findMany.mockResolvedValue([]);

    await service.findAll({});

    expect(prisma.beneficiary.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          active: true,
        }),
      })
    );
  });
});
