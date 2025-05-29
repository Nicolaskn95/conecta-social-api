import { Transform } from 'class-transformer';
import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  Length,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { EmployeeRole } from '../enums/role.enum';
import { ErrorMessages } from '@/common/helper/error-messages';

export class CreateEmployeeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  surname: string;

  @IsDateString()
  birth_date: string;

  @IsEnum(EmployeeRole, {
    message: ErrorMessages.ROLE_INVALID,
  })
  @IsNotEmpty()
  role: EmployeeRole;

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

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => (value === undefined ? true : value))
  active?: boolean;
}
