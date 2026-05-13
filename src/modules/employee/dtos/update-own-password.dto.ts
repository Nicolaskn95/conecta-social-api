import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class UpdateOwnPasswordDto {
  @ApiProperty({ example: 'senhaAtual123' })
  @IsString()
  current_password: string;

  @ApiProperty({ example: 'novaSenha123' })
  @IsString()
  @Length(8, 128)
  new_password: string;
}
