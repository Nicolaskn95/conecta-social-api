import { Transform } from 'class-transformer';
import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  Length,
  IsBoolean,
} from 'class-validator';

export class CreateEmployeeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  surname: string;

  @IsDateString()
  birth_date: string;

  @IsString()
  @IsNotEmpty()
  role: string;

  @IsString()
  @Length(11, 11)
  cpf: string;

  @IsEmail()
  email: string;

  @IsString()
  @Length(8, 128)
  password: string;

  @IsString()
  @Length(8, 9)
  cep: string;

  @IsString()
  @IsNotEmpty()
  street: string;

  @IsString()
  @IsNotEmpty()
  neighborhood: string;

  @IsString()
  @IsNotEmpty()
  number: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @Length(2, 2)
  uf: string;

  @IsString()
  state: string;

  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  complement?: string;

  @IsBoolean()
  @Transform(({ value }) => (value === undefined ? true : value))
  active?: boolean;
}
