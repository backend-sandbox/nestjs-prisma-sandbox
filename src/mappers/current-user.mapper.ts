import { User } from '@prisma/client';
import { CurrentUserDto } from 'src/auth/dto';

export const mapCurrentUser = (user: User): CurrentUserDto => {
  return { id: user.id, email: user.email };
};
