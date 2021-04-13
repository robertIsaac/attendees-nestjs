import { Module } from '@nestjs/common';
import { MassService } from './mass.service';
import { MassController } from './mass.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mass } from './entities/mass.entity';

@Module({
  controllers: [MassController],
  providers: [MassService],
  imports: [TypeOrmModule.forFeature([Mass])],
})
export class MassModule {}
