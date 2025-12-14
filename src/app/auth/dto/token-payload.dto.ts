import { IsEmail, IsNotEmpty, IsUUID } from 'class-validator';

export class TokenPayloadDto {
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;
}
