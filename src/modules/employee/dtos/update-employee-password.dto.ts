import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class UpdateEmployeePasswordDto {
  @ApiProperty({ example: 'novaSenha123' })
  @IsString()
  @Length(8, 128)
  password: string;
}
