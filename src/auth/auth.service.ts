import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { EmployeeRepository } from '@/domain/repositories';
import { ErrorMessages } from '@/common/helper/error-messages';

@Injectable()
export class AuthService {
  constructor(
    private readonly employeeRepository: EmployeeRepository,
    private readonly jwtService: JwtService
  ) {}

  async validateUser(email: string, password: string) {
    const employee = await this.employeeRepository.findByEmail(email);

    if (!employee || !(await bcrypt.compare(password, employee.password))) {
      throw new UnauthorizedException(ErrorMessages.INVALID_CREDENTIALS);
    }
    return employee;
  }

  async login(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      surname: user.surname,
      role: user.role,
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
