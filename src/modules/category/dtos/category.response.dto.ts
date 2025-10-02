import { ApiProperty } from '@nestjs/swagger';

export class CategoryResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID da categoria',
  })
  id: string;

  @ApiProperty({
    example: 'Alimentos',
    description: 'Nome da categoria',
  })
  name: string;

  @ApiProperty({
    example: 'kg',
    description: 'Unidade de medida',
  })
  measure_unity: string;

  @ApiProperty({
    example: true,
    description: 'Status ativo da categoria',
  })
  active: boolean;

  @ApiProperty({
    example: '2024-01-20T10:00:00Z',
    description: 'Data de criação',
  })
  created_at: Date;
}
