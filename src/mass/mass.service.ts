import { Injectable } from '@nestjs/common';
import { CreateMassDto } from './dto/create-mass.dto';
import { UpdateMassDto } from './dto/update-mass.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mass } from './entities/mass.entity';

@Injectable()
export class MassService {
  constructor(@InjectRepository(Mass) private massRepository: Repository<Mass>) {}

  async create(createMassDto: CreateMassDto) {
    return (await this.massRepository.insert(createMassDto)).raw.ops[0];
  }

  findAll() {
    return this.massRepository.find();
  }

  findOne(id: string) {
    return this.massRepository.findOne(id);
  }

  update(id: string, updateMassDto: UpdateMassDto) {
    return this.massRepository.update(id, updateMassDto);
  }

  remove(id: string) {
    return this.massRepository.delete(id);
  }

  findAvailable() {
    const now = new Date();
    const afterThreeHours = new Date(now.valueOf() + 3 * 60 * 60 * 1000);
    return this.massRepository.find({
      where: {
        time: { $gt: afterThreeHours.toISOString() },
        availableFrom: { $lt: new Date().toISOString() },
      },
    });
  }
}
