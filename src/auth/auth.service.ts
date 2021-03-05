import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { UserEntity } from '../users/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService, private jwtService: JwtService) {}

  async validateUser(phone: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(phone);
    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: UserEntity): Promise<{ access_token: string }> {
    const payload = { sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(user: UserEntity): Promise<{ access_token: string } | false> {
    const result = await this.usersService.insert(user);
    if (result) {
      const payload = { sub: result.identifiers[0].id };
      return {
        access_token: this.jwtService.sign(payload),
      };
    }
    return false;
  }
}
