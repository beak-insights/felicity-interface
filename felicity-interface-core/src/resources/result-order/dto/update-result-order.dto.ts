import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateResultOrderDto } from './create-result-order.dto';

export class UpdateResultOrderDto extends PartialType(
  OmitType(CreateResultOrderDto, ['result_raw'] as const),
) {}
