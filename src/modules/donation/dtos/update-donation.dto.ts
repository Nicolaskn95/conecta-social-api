import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

const emptyToUndefined = ({ value }: { value: unknown }) =>
  value === '' || value === null ? undefined : value;

const optionalNumber = ({ value }: { value: unknown }) => {
  if (value === '' || value === null || value === undefined) {
    return undefined;
  }

  const parsedValue = Number(value);
  return Number.isNaN(parsedValue) ? value : parsedValue;
};

const optionalBoolean = ({ value }: { value: unknown }) => {
  if (value === '' || value === null || value === undefined) {
    return undefined;
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return value;
};

export class UpdateDonationDto {
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsUUID()
  category_id?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(60)
  name?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(250)
  description?: string;

  @IsOptional()
  @Transform(optionalNumber)
  @IsNumber()
  initial_quantity?: number;

  @IsOptional()
  @Transform(optionalNumber)
  @IsNumber()
  current_quantity?: number;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(90)
  donator_name?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(10)
  gender?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(20)
  size?: string;

  @IsOptional()
  @Transform(optionalBoolean)
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @Transform(optionalBoolean)
  @IsBoolean()
  available?: boolean;
}
