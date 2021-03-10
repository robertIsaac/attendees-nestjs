import { Controller, Get } from '@nestjs/common';
import { BookService } from './book.service';
import { Status } from '../interfaces/status';
import { DayOfWeekEnum } from '../interfaces/day-of-week.enum';
import { BookEntity } from '../book.entity';

@Controller('book')
export class BookController {
  constructor(private bookService: BookService) {}

  @Get('status')
  async status(): Promise<Status> {
    const status = this.bookService.getDateStatus();
    if (!status) {
      return {
        canBook: false,
        limit: 0,
        message: `there is no available masses now, Friday mass booking opens Wednesday 9 AM and Sunday's mass opens Friday 9 AM`,
      };
    }

    const massDate = BookService.DayToDate(status.time);
    const limit = await this.bookService.getLimit(massDate);

    if (!limit) {
      return {
        canBook: false,
        limit: 0,
        message: `mass limit reached`,
      };
    }

    return {
      canBook: true,
      limit,
      message:
        `you are booking for ${DayOfWeekEnum[status.time.dayOfWeek]} Mass ` +
        `at ${status.time.hour}:${status.time.minute}`,
    };
  }

  @Get('')
  async book(bookEntity: BookEntity) {
    const status = await this.status();

    if (!status.canBook) {
      return false;
    }

    if (bookEntity.otherPeople.length > status.limit) {
      return false;
    }

    const result = await this.bookService.book(bookEntity);
    if (result) {
      return this.bookService.getBook(result.identifiers[0].id);
    }
    return false;
  }
}
