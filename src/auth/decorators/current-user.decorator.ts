import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

/** Extracts the authenticated user injected by JwtAuthGuard from the request. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return (request as any).user;
  },
);
