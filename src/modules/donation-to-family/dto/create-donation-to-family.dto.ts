import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

const emptyToUndefined = ({ value }: { value: unknown }) =>
  value === '' || value === null ? undefined : value;

export class CreateDonationToFamilyDto {
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
  @IsNumber()
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
