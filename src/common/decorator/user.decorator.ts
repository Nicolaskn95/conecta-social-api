import { createParamDecorator, ExecutionContext } from '@nestjs/common';

const LoggedUser = createParamDecorator((_, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest();
  return req.user;
});

export { LoggedUser };
