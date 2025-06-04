import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@/config/prisma/prisma.service';
import { ErrorMessages } from '@/common/helper/error-messages';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  async validateUser(email: string, password: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { email },
    });

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
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
