import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { DeliveryMode, DonationAllocationStatus } from '@/domain/enums';

export class ConfirmReceiptDto {
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsISO8601({ strict: true })
  received_at?: string;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  keep_need_open?: boolean;
}

export class CancelAllocationDto {
  @ApiPropertyOptional({ type: Boolean, default: true })
  @IsOptional()
  @IsBoolean()
  restock?: boolean;

  @ApiPropertyOptional({ type: String, maxLength: 250 })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  note?: string;
}

export class AllocationQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(21474836)
  page?: number;

  @ApiPropertyOptional({ default: 10, maximum: 100 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  size?: number;

  @ApiPropertyOptional({ enum: DonationAllocationStatus })
  @IsOptional()
  @IsEnum(DonationAllocationStatus)
  status?: DonationAllocationStatus;

  @ApiPropertyOptional({ enum: DeliveryMode })
  @IsOptional()
  @IsEnum(DeliveryMode)
  delivery_mode?: DeliveryMode;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  family_id?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  beneficiary_id?: string;
}
