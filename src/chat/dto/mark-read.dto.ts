import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsMongoId } from 'class-validator';

export class MarkReadDto {
  @ApiProperty({
    description: 'ID of the message to mark as read',
    example: '507f1f77bcf86cd799439013',
  })
  @IsNotEmpty()
  @IsString()
  @IsMongoId()
  messageId: string;
}
