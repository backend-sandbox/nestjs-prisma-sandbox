import { User } from '@prisma/client';

export const mapCurrentUser = (user: User) => {
  return { id: user.id, email: user.email };
};
