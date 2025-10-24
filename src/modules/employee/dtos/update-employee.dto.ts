import { PartialType } from '@nestjs/mapped-types';
import { CreateEmployeeDto } from './create-employee.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  Length,
} from 'class-validator';
import { EmployeeRole } from '@prisma/client';

export class UpdateEmployeeDto extends PartialType(CreateEmployeeDto) {
  @ApiPropertyOptional({ example: 'João' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({ example: 'Silva' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  surname?: string;

  @ApiPropertyOptional({ example: '1990-05-21' })
  @IsOptional()
  @IsDateString()
  birth_date?: string;

  @ApiPropertyOptional({ example: '123.456.789-00' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  cpf?: string;

  @ApiPropertyOptional({ example: 'joao@email.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '(11) 91234-5678' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  phone?: string;

  @ApiPropertyOptional({ example: 'novaSenha123' })
  @IsOptional()
  @IsString()
  @Length(6, 20)
  password?: string;

  @ApiPropertyOptional({
    enum: EmployeeRole,
    example: EmployeeRole.ADMIN,
  })
  @IsOptional()
  @IsEnum(EmployeeRole)
  role?: EmployeeRole;

  @ApiPropertyOptional({ example: '01001-000' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  cep?: string;

  @ApiPropertyOptional({ example: 'Rua das Flores' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  street?: string;

  @ApiPropertyOptional({ example: 'Centro' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  neighborhood?: string;

  @ApiPropertyOptional({ example: '123' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  number?: string;

  @ApiPropertyOptional({ example: 'São Paulo' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  city?: string;

  @ApiPropertyOptional({ example: 'São Paulo' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  state?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
