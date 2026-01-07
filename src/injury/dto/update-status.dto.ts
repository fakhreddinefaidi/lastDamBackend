import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEnum } from 'class-validator';
import { MedicalStatus } from '../injury.schema';

export class UpdateStatusDto {
  @ApiProperty({
    description: 'Medical status of the player',
    enum: MedicalStatus,
    example: MedicalStatus.INDISPONIBLE,
  })
  @IsNotEmpty()
  @IsEnum(MedicalStatus)
  status: MedicalStatus;
}

