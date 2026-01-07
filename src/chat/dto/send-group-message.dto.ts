import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SendGroupMessageDto {
  @ApiProperty({
    description: 'ID of the group',
    example: '507f1f77bcf86cd799439011',
  })
  @IsNotEmpty()
  @IsString()
  groupId: string;

  @ApiProperty({
    description: 'ID of the message sender',
    example: 'user1',
  })
  @IsNotEmpty()
  @IsString()
  senderId: string;

  @ApiProperty({
    description: 'Message content',
    example: 'Hello everyone!',
  })
  @IsNotEmpty()
  @IsString()
  message: string;
}

