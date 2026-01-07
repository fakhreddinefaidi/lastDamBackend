import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AddRecommendationDto {
  @ApiProperty({
    description: 'Medical recommendation from the academy',
    example: 'Apply ice 2 times a day for 15 minutes',
    maxLength: 500,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  recommendation: string;
}

