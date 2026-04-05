import {
  IsString,
  IsUUID,
  IsOptional,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

export class CreateTtsJobDto {
  @IsString()
  text!: string;

  @IsUUID()
  voiceId!: string;

  @IsOptional()
  @IsNumber()
  @Min(0.25)
  @Max(4)
  speed?: number;

  @IsOptional()
  @IsNumber()
  @Min(-12)
  @Max(12)
  pitch?: number;
}
