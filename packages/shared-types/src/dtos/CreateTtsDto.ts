import {
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  MinLength,
} from "class-validator";

export class CreateTtsDto {
  @IsString()
  @MinLength(1)
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
