import { User } from '@prisma/client';

export const mapUser = (user: User) => {
  return { id: user.id, email: user.email };
};
