import { IsNumber, IsString, IsUUID } from "class-validator";

export class UpdateCreditsDto {
  @IsUUID()
  userId!: string;

  @IsNumber()
  amount!: number;

  @IsString()
  description!: string;

  @IsString()
  type!: string;
}
