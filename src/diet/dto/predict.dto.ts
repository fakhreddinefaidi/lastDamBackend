import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsEnum,
  Min,
  Max,
} from 'class-validator';

export enum PlayerPosition {
  GOALKEEPER = 'goalkeeper',
  DEFENDER = 'defender',
  MIDFIELDER = 'midfielder',
  FORWARD = 'forward',
}

export enum PlayerGoal {
  WEIGHT_LOSS = 'weight_loss',
  MUSCLE_GAIN = 'muscle_gain',
  MAINTENANCE = 'maintenance',
  PERFORMANCE = 'performance',
}

export enum InjuryRisk {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export class PredictDto {
  @ApiProperty({
    description: 'Player age in years',
    example: 25,
    minimum: 15,
    maximum: 50,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(15)
  @Max(50)
  age: number;

  @ApiProperty({
    description: 'Player height in centimeters',
    example: 180,
    minimum: 150,
    maximum: 220,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(150)
  @Max(220)
  height: number;

  @ApiProperty({
    description: 'Player weight in kilograms',
    example: 75,
    minimum: 40,
    maximum: 150,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(40)
  @Max(150)
  weight: number;

  @ApiProperty({
    description: 'Player position on the field',
    enum: PlayerPosition,
    example: PlayerPosition.MIDFIELDER,
  })
  @IsNotEmpty()
  @IsEnum(PlayerPosition)
  position: PlayerPosition;

  @ApiProperty({
    description: 'Player fitness goal',
    enum: PlayerGoal,
    example: PlayerGoal.PERFORMANCE,
  })
  @IsNotEmpty()
  @IsEnum(PlayerGoal)
  goal: PlayerGoal;

  @ApiProperty({
    description: 'Training intensity level (1-10 scale)',
    example: 7,
    minimum: 1,
    maximum: 10,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(10)
  trainingIntensity: number;

  @ApiProperty({
    description: 'Number of matches per week',
    example: 2,
    minimum: 0,
    maximum: 7,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(7)
  matchesPerWeek: number;

  @ApiProperty({
    description: 'Injury risk level',
    enum: InjuryRisk,
    example: InjuryRisk.LOW,
  })
  @IsNotEmpty()
  @IsEnum(InjuryRisk)
  injuryRisk: InjuryRisk;

  @ApiProperty({
    description: 'Body fat percentage',
    example: 15,
    minimum: 5,
    maximum: 40,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(5)
  @Max(40)
  bodyfatPercent: number;
}

