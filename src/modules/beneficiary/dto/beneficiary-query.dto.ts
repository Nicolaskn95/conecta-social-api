import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
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

export class BeneficiaryQueryDto {
  @ApiPropertyOptional({ description: 'Filtrar por ID da família', format: 'uuid' })
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsUUID()
  family_id?: string;

  @ApiPropertyOptional({ description: 'Filtrar por presença de deficiência' })
  @IsOptional()
  @Transform(parseBoolean)
  @IsBoolean()
  has_disability?: boolean;

  @ApiPropertyOptional({ description: 'Busca textual por nome, sobrenome, CPF ou RG' })
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(120)
  search?: string;

  @ApiPropertyOptional({ description: 'Incluir beneficiários inativos', default: false })
  @IsOptional()
  @Transform(parseBoolean)
  @IsBoolean()
  include_inactive?: boolean;
}

export class BeneficiaryPaginatedQueryDto extends BeneficiaryQueryDto {
  @ApiPropertyOptional({ description: 'Página atual', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Quantidade por página', default: 10, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  size?: number;
}
