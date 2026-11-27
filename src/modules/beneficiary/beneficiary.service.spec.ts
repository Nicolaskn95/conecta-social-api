import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { BeneficiaryService } from './beneficiary.service';
import { AuditActionType, AuditEntityType } from '@/domain/enums';

describe('BeneficiaryService', () => {
  const ctx = { __transactionContext: true } as const;
  let repository: any;
  let families: any;
  let transactions: any;
  let audit: any;
  let service: BeneficiaryService;
  const needs = { moveOpenForBeneficiary: jest.fn() };
  const allocations = { findWaitingForBeneficiary: jest.fn() };
  const dto = {
    id_family: 'family-1', name: 'Maria', surname: 'Silva',
    birth_date: '1990-01-01', gender: 'Feminino', has_disability: false,
  };
  beforeEach(() => {
    repository = { create: jest.fn(), update: jest.fn(), findById: jest.fn(), findAll: jest.fn(), count: jest.fn(), suggestions: jest.fn() };
    families = { findActiveById: jest.fn().mockResolvedValue({ id: 'family-1' }) };
    transactions = { run: jest.fn(work => work(ctx)) };
    audit = { write: jest.fn() };
    repository.lockForNeeds = jest.fn().mockResolvedValue(true);
    needs.moveOpenForBeneficiary.mockReset().mockResolvedValue(0);
    allocations.findWaitingForBeneficiary.mockReset().mockResolvedValue(null);
    service = new BeneficiaryService(
      repository, families, transactions, audit, needs as any, allocations as any
    );
  });

  it('cria e audita usando a mesma transação, normalizando CPF', async () => {
    repository.create.mockResolvedValue({ id: 'b1', id_family: 'family-1' });
    await service.create({ ...dto, cpf: '123.456.789-01', disability_details: 'Visual' });
    expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({
      cpf: '12345678901', disability_details: null, active: true,
    }), ctx);
    expect(audit.write).toHaveBeenCalledWith(expect.objectContaining({
      ctx, entityType: AuditEntityType.BENEFICIARY, actionType: AuditActionType.CREATE,
    }));
  });

  it('exige família ativa e detalhes da deficiência', async () => {
    await expect(service.create({ ...dto, has_disability: true })).rejects.toBeInstanceOf(BadRequestException);
    families.findActiveById.mockResolvedValue(null);
    await expect(service.create(dto)).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('limpa deficiência ao atualizar e audita na mesma transação', async () => {
    repository.findById.mockResolvedValue({ id: 'b1', id_family: 'family-1', has_disability: true, disability_details: 'Visual' });
    repository.update.mockResolvedValue({ id: 'b1' });
    await service.update('b1', { has_disability: false });
    expect(repository.update).toHaveBeenCalledWith('b1', expect.objectContaining({ has_disability: false, disability_details: null }), ctx);
    expect(audit.write).toHaveBeenCalledWith(expect.objectContaining({ ctx, actionType: AuditActionType.UPDATE }));
  });

  it('move pedidos abertos e audita a troca de família na transação', async () => {
    repository.findById.mockResolvedValue({ id: 'b1', id_family: 'family-1' });
    repository.update.mockResolvedValue({ id: 'b1', id_family: 'family-2' });
    needs.moveOpenForBeneficiary.mockResolvedValue(2);

    await service.update('b1', { id_family: 'family-2' });

    expect(repository.lockForNeeds).toHaveBeenCalledWith('b1', ctx);
    expect(needs.moveOpenForBeneficiary).toHaveBeenCalledWith('b1', 'family-2', ctx);
    expect(audit.write).toHaveBeenCalledWith(expect.objectContaining({
      ctx,
      metadata: expect.objectContaining({ previous_family_id: 'family-1', family_id: 'family-2', moved_needs: 2 }),
    }));
  });

  it('preserva família e pedidos quando existe uma destinação pendente', async () => {
    repository.findById.mockResolvedValue({ id: 'b1', id_family: 'family-1' });
    allocations.findWaitingForBeneficiary.mockResolvedValue('destinacao-1');

    await expect(service.update('b1', { id_family: 'family-2' })).rejects.toBeInstanceOf(ConflictException);

    expect(needs.moveOpenForBeneficiary).not.toHaveBeenCalled();
    expect(repository.update).not.toHaveBeenCalled();
    expect(audit.write).not.toHaveBeenCalled();
  });

  it('rejeita CPF duplicado do MongoDB', async () => {
    repository.create.mockRejectedValue({ code: 11000, keyPattern: { cpf: 1 } });
    await expect(service.create(dto)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('propaga falha de auditoria para reverter a transação', async () => {
    repository.create.mockResolvedValue({ id: 'b1' });
    audit.write.mockRejectedValue(new Error('audit failed'));
    await expect(service.create(dto)).rejects.toThrow('audit failed');
  });

  it('desativa e audita na mesma transação', async () => {
    repository.findById.mockResolvedValue({ id: 'b1' });
    repository.update.mockResolvedValue({ id: 'b1', active: false });
    await service.remove('b1');
    expect(repository.update).toHaveBeenCalledWith('b1', { active: false }, ctx);
    expect(audit.write).toHaveBeenCalledWith(expect.objectContaining({ ctx, actionType: AuditActionType.SOFT_DELETE }));
  });
});
