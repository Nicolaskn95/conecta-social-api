/* eslint-disable prettier/prettier */
export const ErrorMessages = {
  // Employee
  EMAIL_DUPLICATE: 'Já existe um funcionário com este e-mail.',
  CPF_DUPLICATE: 'Já existe um funcionário com este CPF.',
  ROLE_INVALID: 'O campo role deve ser um dos seguintes: ADMIN, MANAGER, VOLUNTEER',
  INVALID_BOOLEAN: 'O valor precisa ser verdadeiro ou falso (booleano)',
  EMPLOYEE_NOT_FOUND: 'Funcionário não encontrado.',
  EMPLOYEE_INACTIVE: 'Funcionário inativo.',

  // Event
  EVENT_NOT_FOUND: 'Evento não encontrado.',
  INVALID_EVENT_STATUS: 'Status do evento inválido.',

  // Auth
  INVALID_CREDENTIALS: 'E-mail ou senha inválidos.',
  UNAUTHORIZED: 'Você não tem permissão para acessar este recurso.',

  // Generic
  INTERNAL_SERVER_ERROR: 'Erro interno do servidor.',
  RESOURCE_ALREADY_EXISTS: 'Recurso já cadastrado.',
  VALIDATION_FAILED: 'Erro de validação nos campos informados.',
};
