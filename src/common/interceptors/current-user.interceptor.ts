import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { UserService } from '../../app/user/user.service';
import { RequestWithUser } from '../types';

@Injectable()
export class CurrentUserInterceptor implements NestInterceptor {
  constructor(private readonly userService: UserService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const { userId } = request.session ?? {};

    if (userId) {
      const currentUser = await this.userService.getUserById(userId);

      if (currentUser) {
        request.currentUser = currentUser;
      }
    }

    return next.handle();
  }
}
