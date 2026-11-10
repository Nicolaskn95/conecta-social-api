import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

const emptyToUndefined = ({ value }: { value: unknown }) =>
  value === '' || value === null ? undefined : value;

const parseBoolean = ({ value }: { value: unknown }) => {
  if (value === true || value === 'true') {
    return true;
  }

  if (value === false || value === 'false') {
    return false;
  }

  return value;
};

const normalizeCpf = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') {
    return value;
  }

  const digits = value.replace(/\D/g, '');
  return digits === '' ? undefined : digits;
};

export class CreateBeneficiaryDto {
  @ApiProperty({ description: 'ID da família', format: 'uuid' })
  @IsUUID()
  id_family: string;

  @ApiProperty({ description: 'Nome do beneficiário', maxLength: 30 })
  @IsString()
  @MaxLength(30)
  name: string;

  @ApiProperty({ description: 'Sobrenome do beneficiário', maxLength: 60 })
  @IsString()
  @MaxLength(60)
  surname: string;

  @ApiProperty({
    description: 'Data de nascimento (ISO-8601)',
    example: '1990-05-12',
  })
  @IsDateString()
  birth_date: string;

  @ApiProperty({
    description: 'CPF com 11 dígitos (opcional)',
    required: false,
    maxLength: 11,
  })
  @IsOptional()
  @Transform(normalizeCpf)
  @Matches(/^\d{11}$/, { message: 'CPF deve conter 11 dígitos numéricos' })
  cpf?: string;

  @ApiProperty({ description: 'RG (opcional)', required: false, maxLength: 15 })
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(15)
  rg?: string;

  @ApiProperty({
    description: 'E-mail (opcional)',
    required: false,
    maxLength: 60,
  })
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsEmail()
  @MaxLength(60)
  email?: string;

  @ApiProperty({ description: 'Telefone (opcional)', required: false, maxLength: 15 })
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(15)
  phone?: string;

  @ApiProperty({
    description: 'Possui deficiência',
    example: false,
  })
  @Transform(parseBoolean)
  @IsBoolean()
  has_disability: boolean;

  @ApiProperty({
    description: 'Detalhes da deficiência (obrigatório quando has_disability=true)',
    required: false,
    maxLength: 90,
  })
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(90)
  disability_details?: string;

  @ApiProperty({ description: 'Gênero', maxLength: 30 })
  @IsString()
  @MaxLength(30)
  gender: string;

  @ApiProperty({ description: 'Status ativo/inativo', required: false })
  @IsOptional()
  @Transform(parseBoolean)
  @IsBoolean()
  active?: boolean;
}
