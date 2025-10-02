import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({
    example: 'Alimentos',
    description: 'Nome da categoria',
    maxLength: 25,
  })
  @IsNotEmpty({ message: 'O nome é obrigatório' })
  @IsString()
  @MaxLength(25)
  name: string;

  @ApiProperty({
    example: 'kg',
    description: 'Unidade de medida da categoria',
    maxLength: 10,
  })
  @IsNotEmpty({ message: 'A unidade de medida é obrigatória' })
  @IsString()
  @MaxLength(10)
  measure_unity: string;
}
