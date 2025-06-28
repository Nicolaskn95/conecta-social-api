import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { EmployeeRole } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEmployeeDto {
  @ApiProperty({
    example: 'João',
    description: 'Primeiro nome do funcionário',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'Silva',
    description: 'Sobrenome do funcionário',
  })
  @IsString()
  @IsNotEmpty()
  surname: string;

  @ApiProperty({
    example: '1990-05-21',
    description: 'Data de nascimento no formato ISO',
  })
  @IsDateString()
  birth_date: string;

  @ApiProperty({
    example: '123.456.789-00',
    description: 'CPF do funcionário (somente números)',
  })
  @IsString()
  @IsNotEmpty()
  cpf: string;

  @ApiProperty({
    example: 'joao@email.com',
    description: 'Email institucional do funcionário',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '(11) 91234-5678',
    description: 'Número de telefone com DDD',
  })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    example: 'senha123',
    description: 'Senha de acesso',
  })
  @IsString()
  @Length(8, 128)
  password: string;

  @ApiProperty({
    enum: EmployeeRole,
    description: 'Papel do funcionário no sistema',
    example: EmployeeRole.ADMIN,
  })
  @IsEnum(EmployeeRole, {
    message: `role deve ser um dos valores: ${Object.values(EmployeeRole).join(', ')}`,
  })
  role: EmployeeRole;

  @ApiProperty({
    example: '01001-000',
    description: 'CEP do endereço',
  })
  @IsString()
  @IsNotEmpty()
  cep: string;

  @ApiProperty({
    example: 'Rua das Flores',
    description: 'Nome da rua',
  })
  @IsString()
  @IsNotEmpty()
  street: string;

  @ApiProperty({
    example: 'Centro',
    description: 'Bairro',
  })
  @IsString()
  @IsNotEmpty()
  neighborhood: string;

  @ApiProperty({
    example: '123',
    description: 'Número da residência',
  })
  @IsString()
  @IsNotEmpty()
  number: string;

  @ApiProperty({
    example: 'São Paulo',
    description: 'Cidade',
  })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({
    example: 'SP',
    description: 'UF do estado',
  })
  @IsString()
  @IsNotEmpty()
  uf: string;

  @ApiProperty({
    example: 'São Paulo',
    description: 'Nome completo do estado',
  })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Define se o funcionário está ativo',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value ?? true)
  active?: boolean;
}
