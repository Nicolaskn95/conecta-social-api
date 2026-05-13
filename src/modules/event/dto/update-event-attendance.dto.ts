import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class UpdateEventAttendanceDto {
  @ApiProperty({ example: 120 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  attendance: number;
}
