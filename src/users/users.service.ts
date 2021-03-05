import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InsertResult, Repository } from 'typeorm';
import { UserEntity } from './user.entity';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
    private configService: ConfigService,
  ) {}

  async findOne(phone: string): Promise<UserEntity | undefined> {
    return this.usersRepository.findOne({ phone });
  }

  async findById(id: string): Promise<Omit<UserEntity, 'password'> | undefined> {
    const result = await this.usersRepository.findOne(id);
    if (!result) {
      return;
    }
    const { password, ...user } = result;
    return user;
  }

  async insert(user: UserEntity): Promise<InsertResult | false> {
    try {
      const slatRound = +this.configService.get<number>('BCRYPT_SALT_ROUNDS', 10);
      user.password = await bcrypt.hash(user.password, slatRound);
      return await this.usersRepository.insert(user);
    } catch (e) {
      return false;
    }
  }
}
