import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/db/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private readonly prisma: PrismaService
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (user && (await this.comparePasswords(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  private async comparePasswords(
    password: string,
    hashedPasswords: string
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPasswords);
  }

  async login(user: any): Promise<any> {
    const payload = { email: user.email, name: user.name, userId: user.id };
    console.log(payload);
    return this.jwtService.sign(payload);
  }
}
