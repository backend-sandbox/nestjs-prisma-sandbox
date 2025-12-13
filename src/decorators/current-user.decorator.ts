import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { CurrentUserData, RequestWithUser } from '../types';

export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext): CurrentUserData | null => {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    return request.currentUser || null;
  },
);
