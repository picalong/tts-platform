import {
  IsString,
  IsUUID,
  IsOptional,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTtsJobDto {
  @ApiProperty({
    example: 'Hello, this is a test of text to speech!',
    description: 'Text to convert to speech',
  })
  @IsString()
  text!: string;

  @ApiProperty({
    example: 'uuid-here',
    description: 'Voice ID from available voices',
  })
  @IsUUID()
  voiceId!: string;

  @ApiPropertyOptional({
    example: 1.0,
    description: 'Speech speed (0.25 - 4.0)',
    minimum: 0.25,
    maximum: 4,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.25)
  @Max(4)
  speed?: number;

  @ApiPropertyOptional({
    example: 0,
    description: 'Speech pitch (-12 to 12)',
    minimum: -12,
    maximum: 12,
  })
  @IsOptional()
  @IsNumber()
  @Min(-12)
  @Max(12)
  pitch?: number;
}
