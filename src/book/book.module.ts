import { Module } from '@nestjs/common';
import { BookController } from './book/book.controller';
import { BookService } from './book/book.service';

@Module({
  controllers: [BookController],
  providers: [BookService],
  imports: [],
})
export class BookModule {}
