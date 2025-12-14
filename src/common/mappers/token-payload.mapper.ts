import { TokenPayloadDto } from '@app/auth/dto';

export const mapUserToTokenPayload = (user: TokenPayloadDto): TokenPayloadDto => {
  const tokenPayloadUser: TokenPayloadDto = {
    id: user.id,
    email: user.email,
  };

  return tokenPayloadUser;
};
