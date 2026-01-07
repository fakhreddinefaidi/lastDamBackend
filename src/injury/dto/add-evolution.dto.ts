import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

export class AddEvolutionDto {
  @ApiProperty({
    description: 'Pain level from 0 to 10',
    example: 5,
    minimum: 0,
    maximum: 10,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(10)
  painLevel: number;

  @ApiProperty({
    description: 'Note about the evolution',
    example: 'Feeling better today, less pain',
    maxLength: 500,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  note: string;
}

