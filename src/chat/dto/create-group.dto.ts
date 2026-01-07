import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateGroupDto {
  @ApiProperty({
    description: 'Name of the group',
    example: 'Tournament Team Alpha',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Description of the group (optional)',
    example: 'Group for team Alpha members',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'ID of the user creating the group (will be set as admin)',
    example: 'user1',
  })
  @IsNotEmpty()
  @IsString()
  creatorId: string;

  @ApiProperty({
    description: 'Simple group ID (optional). If not provided, MongoDB will generate one. Use simple IDs like "group1", "group2" for easy testing.',
    example: 'group1',
    required: false,
  })
  @IsOptional()
  @IsString()
  groupId?: string;

  @ApiProperty({
    description: 'Avatar URL of the group (optional)',
    example: 'https://example.com/avatar.png',
    required: false,
  })
  @IsOptional()
  @IsString()
  avatar?: string;
}

