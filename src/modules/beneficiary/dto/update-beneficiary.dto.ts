import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateBeneficiaryDto } from './create-beneficiary.dto';

export class UpdateBeneficiaryDto extends PartialType(
  OmitType(CreateBeneficiaryDto, ['active'] as const)
) {}
