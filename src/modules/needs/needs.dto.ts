import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { ItemSpecifications } from '@/domain/entities';
import { NeedStatus } from '@/domain/enums';

export class NeedComplementsDto {
  @ApiPropertyOptional({ type: String, format: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  item_type_id?: string | null;

  @ApiPropertyOptional({ type: String, maxLength: 500, nullable: true })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() || null : value
  )
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;

  @ApiPropertyOptional({
    type: Number,
    minimum: 1,
    maximum: 2147483647,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(2147483647)
  requested_quantity?: number | null;

  @ApiPropertyOptional({
    type: 'object',
    nullable: true,
    properties: {
      seat_width_cm: { type: 'number' },
      shoe_size_br: { type: 'integer' },
    },
  })
  @IsOptional()
  @IsObject()
  specifications?: ItemSpecifications | null;
}

export class UpdateNeedDto extends NeedComplementsDto {
  @ApiPropertyOptional({ enum: [NeedStatus.CLOSED] })
  @ValidateIf((_dto, value) => value !== undefined)
  @IsIn([NeedStatus.CLOSED])
  status?: NeedStatus.CLOSED;
}

export class NeedsQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(2147483647)
  page?: number;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  size?: number;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  family_id?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  beneficiary_id?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  item_type_id?: string;

  @ApiPropertyOptional({ enum: NeedStatus })
  @IsOptional()
  @IsEnum(NeedStatus)
  status?: NeedStatus;
}

export class ItemTypesQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  category_id?: string;

  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;
}
