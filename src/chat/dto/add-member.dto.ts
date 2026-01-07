import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsArray } from 'class-validator';

export class AddMemberDto {
  @ApiProperty({
    description: 'ID of the user to add to the group',
    example: 'user2',
  })
  @IsNotEmpty()
  @IsString()
  userId: string;
}

export class AddMultipleMembersDto {
  @ApiProperty({
    description: 'Array of user IDs to add to the group',
    example: ['user2', 'user3', 'user4'],
    type: [String],
  })
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  userIds: string[];
}

