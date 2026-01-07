import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({
    description: 'ID of the message sender',
    example: 'user1',
  })
  @IsNotEmpty()
  @IsString()
  senderId: string;

  @ApiProperty({
    description: 'ID of the message receiver',
    example: 'user2',
  })
  @IsNotEmpty()
  @IsString()
  receiverId: string;

  @ApiProperty({
    description: 'Message content',
    example: 'Hello, how are you?',
  })
  @IsNotEmpty()
  @IsString()
  message: string;
}
