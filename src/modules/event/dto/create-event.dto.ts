import {
  IsString,
  IsOptional,
  IsDateString,
  IsBoolean,
  IsInt,
} from 'class-validator';

export class CreateEventDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  greeting_description?: string;

  @IsOptional()
  @IsInt()
  attendance?: number;

  @IsOptional()
  @IsString()
  embedded_instagram?: string;

  @IsString()
  cep: string;

  @IsString()
  street: string;

  @IsString()
  neighborhood: string;

  @IsString()
  number: string;

  @IsString()
  city: string;

  @IsString()
  uf: string;

  @IsString()
  state: string;

  @IsOptional()
  @IsString()
  complement?: string;

  @IsString()
  status: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
