import { PartialType } from '@nestjs/mapped-types';
import { CreateResultOrderDto } from './create-result-order.dto';

export class UpdateResultOrderDto extends PartialType(CreateResultOrderDto) {}
