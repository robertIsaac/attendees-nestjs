import { Body, Controller, Get, HttpException, HttpStatus, Post, Query } from '@nestjs/common';
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

    if (limit <= 0) {
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

  @Post('')
  async book(@Body() bookEntity: BookEntity) {
    const status = await this.status();

    if (!status.canBook) {
      throw new HttpException('there is no available mass to book', HttpStatus.BAD_REQUEST);
    }

    if (bookEntity.otherPeople.length >= status.limit) {
      throw new HttpException(`maximum allowed attendances are ${status.limit}`, HttpStatus.BAD_REQUEST);
    }

    bookEntity.massTime = BookService.DayToDate(this.bookService.getDateStatus().time);
    bookEntity.createAt = new Date();

    if (!(await this.bookService.hasDuplicateName(bookEntity.massTime, bookEntity))) {
      throw new HttpException('a name of the attendance is already registered', HttpStatus.BAD_REQUEST);
    }

    const result = await this.bookService.book(bookEntity);

    if (result) {
      return this.bookService.getBook(result.identifiers[0].id);
    }

    throw new HttpException('something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
  }

  @Get('dates')
  async dates() {
    const dates = (await this.bookService.getDates()).map((book) => book.massTime.toISOString());
    return [...new Set(dates)];
  }

  @Get('attendees')
  async attendees(@Query('massTime') massTime: string) {
    return this.bookService.attendees(massTime);
  }
}
