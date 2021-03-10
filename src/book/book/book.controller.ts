import { Controller, Get } from '@nestjs/common';
import { BookService } from './book.service';
import { Status } from '../interfaces/status';
import { DayOfWeekEnum } from '../interfaces/day-of-week.enum';

@Controller('book')
export class BookController {
  constructor(private bookService: BookService) {}

  @Get('status') status(): Status {
    const status = this.bookService.getDateStatus();
    if (!status) {
      return {
        canBook: false,
        limit: 0,
        message: `there is no available masses now, Friday mass booking opens Wednesday 9 AM and Sunday's mass opens Friday 9 AM`,
      };
    }

    return {
      canBook: true,
      limit: status.limit,
      message:
        `you are booking for ${DayOfWeekEnum[status.time.dayOfWeek]} Mass ` +
        `at ${status.time.hour}:${status.time.minute}`,
    };
  }

  @Get('')
  book() {
    this.bookService.book()
  }
}
