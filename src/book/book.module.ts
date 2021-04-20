import { Module } from '@nestjs/common';
import { BookController } from './book/book.controller';
import { BookService } from './book/book.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookEntity } from './book.entity';
import { MassModule } from '../mass/mass.module';

@Module({
  controllers: [BookController],
  providers: [BookService],
  imports: [TypeOrmModule.forFeature([BookEntity]), MassModule],
})
export class BookModule {}
