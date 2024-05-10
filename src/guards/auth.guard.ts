import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const request = context.switchToHttp().getRequest<Request>()
    const authorizationHeader = request.headers['authorization'];
    if (!authorizationHeader) {
      return false;
    }

    const token = authorizationHeader.split(' ')[1];
    if (!token) {
      return false;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const decodedToken = jwt.verify(token, 'qazwsxedcrfvtgbyhnujmikolp');
      return true;
    } catch (error) {
      console.error('Error verifying JWT:', error);
      return false;
    }
  }
}

