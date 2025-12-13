import { Request } from 'express';

export interface CurrentUserData {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RequestWithUser extends Request {
  session?: { userId?: string };
  currentUser?: CurrentUserData;
}
