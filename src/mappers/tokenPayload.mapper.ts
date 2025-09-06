import { TokenPayloadDto } from 'src/auth/dtos';

export const mapUserToTokenPayload = (
  user: TokenPayloadDto,
): TokenPayloadDto => {
  const tokenPayloadUser: TokenPayloadDto = {
    id: user.id,
    email: user.email,
  };

  return tokenPayloadUser;
};
