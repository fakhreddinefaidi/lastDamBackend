import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { InjuryType, InjurySeverity } from '../injury.schema';

export class CreateInjuryDto {
  @ApiProperty({
    description: 'Type of injury',
    enum: InjuryType,
    example: InjuryType.MUSCLE,
  })
  @IsNotEmpty()
  @IsEnum(InjuryType)
  type: InjuryType;

  @ApiProperty({
    description: 'Severity of the injury',
    enum: InjurySeverity,
    example: InjurySeverity.MEDIUM,
  })
  @IsNotEmpty()
  @IsEnum(InjurySeverity)
  severity: InjurySeverity;

  @ApiProperty({
    description: 'Description of the injury',
    example: 'Pain in the right thigh during training',
    maxLength: 1000,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(1000)
  description: string;
}

