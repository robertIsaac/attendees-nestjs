import { Controller, Request, Post, UseGuards, Get, HttpException, HttpStatus, Body } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from '../../users/users.service';
import { AuthService } from '../auth.service';
import { UserEntity } from '../../users/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService, private usersService: UsersService) {}

  @UseGuards(AuthGuard('local'))
  @Post('login')
  async login(@Request() req: { user: UserEntity }): Promise<{ access_token: string }> {
    return this.authService.login(req.user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  getProfile(@Request() req: { user: UserEntity }): Promise<Omit<UserEntity, 'password'> | undefined> {
    return this.usersService.findById(req.user.id);
  }

  @Post('register')
  async register(@Body() user: UserEntity): Promise<{ access_token: string }> {
    const token = await this.authService.register(user);
    if (token) {
      return token;
    }
    throw new HttpException('phone exists', HttpStatus.BAD_REQUEST);
  }
}
