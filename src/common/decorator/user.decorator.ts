import { createParamDecorator, ExecutionContext } from '@nestjs/common';

const LoggedUser = createParamDecorator((_, ctx: ExecutionContext) => {
  console.log('LoggedUser decorator called');
  const req = ctx.switchToHttp().getRequest();
  // const user = req.user?.email || 'anonymous';
  // this.logger.log(`[${method}] ${originalUrl} by ${user}`, 'HTTP');
  return req.user;
});

export { LoggedUser };
