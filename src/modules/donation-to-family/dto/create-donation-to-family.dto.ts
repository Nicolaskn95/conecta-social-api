import { DeliveryMode } from '@/domain/enums';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsInt,
  IsEnum,
  Max,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

const emptyToUndefined = ({ value }: { value: unknown }) =>
  value === '' || value === null ? undefined : value;

export class CreateDonationToFamilyDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  id_beneficiary?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  id_need?: string;

  @ApiPropertyOptional({ enum: DeliveryMode })
  @IsOptional()
  @IsEnum(DeliveryMode)
  delivery_mode?: DeliveryMode;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  request_id?: string;

  @ApiProperty({
    description: 'ID da doação que será vinculada à família',
    format: 'uuid',
  })
  @IsNotEmpty()
  @IsUUID()
  id_donation: string;

  @ApiProperty({
    description: 'ID da família que receberá a doação',
    format: 'uuid',
  })
  @IsNotEmpty()
  @IsUUID()
  id_family: string;

  @ApiProperty({
    description: 'Quantidade doada para a família',
    example: 5,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Max(2147483647)
  @Min(1)
  quantity: number;

  @ApiProperty({
    description: 'Observação opcional da baixa/entrega',
    required: false,
    maxLength: 250,
  })
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(250)
  update_message?: string;
}
