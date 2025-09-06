import { Injectable } from '@nestjs/common';

@Injectable({})
export class AuthService {
  signup() {
    return { hi: 'signup' };
  }

  signin() {
    return { hi: 'signin' };
  }
}
