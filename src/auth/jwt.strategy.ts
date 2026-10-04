import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { EmployeeRepository } from '@/domain/repositories';
import { ErrorMessages } from '@/common/helper/error-messages';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly employeeRepository: EmployeeRepository) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    const employee = await this.employeeRepository.findById(payload.sub);

    if (!employee || !employee.active) {
      throw new UnauthorizedException(ErrorMessages.UNAUTHORIZED);
    }

    return employee;
  }
}
