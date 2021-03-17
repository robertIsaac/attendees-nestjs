import { Body, Controller, Get, HttpException, HttpStatus, Post, Query } from '@nestjs/common';
import { BookService } from './book.service';
import { Status } from '../interfaces/status';
import { ArabicDayOfWeekEnum, DayOfWeekEnum } from '../interfaces/day-of-week.enum';
import { BookEntity } from '../book.entity';
import { I18n, I18nContext, I18nLang } from 'nestjs-i18n';

@Controller('book')
export class BookController {
  constructor(private bookService: BookService) {}

  @Get('status')
  async status(@I18n() i18n: I18nContext, @I18nLang() lang: string): Promise<Status> {
    const status = this.bookService.getDateStatus();
    if (!status) {
      const message = await i18n.translate('message.no available masses');
      return {
        canBook: false,
        limit: 0,
        message,
      };
    }

    const massTime = BookService.DayToDate(status.time);
    const limit = await this.bookService.getLimit(massTime);

    if (limit <= 0) {
      const message = await i18n.translate('message.mass limit reached');
      return {
        canBook: false,
        limit: 0,
        message,
      };
    }

    let dayOfWeek = DayOfWeekEnum[status.time.dayOfWeek];
    if (lang === 'ar') {
      dayOfWeek = ArabicDayOfWeekEnum[status.time.dayOfWeek];
    }

    const message = await i18n.translate('message.booking for', { args: { ...status.time, dayOfWeek } });

    return {
      canBook: true,
      limit,
      message,
      massTime,
    };
  }

  @Post('')
  async book(@Body() bookEntity: BookEntity, @I18n() i18n: I18nContext, @I18nLang() lang: string) {
    const status = await this.status(i18n, lang);

    if (!status.canBook) {
      throw new HttpException('there is no available mass to book', HttpStatus.BAD_REQUEST);
    }

    if (bookEntity.otherPeople.length >= status.limit) {
      const message = await i18n.translate('message.maximum allowed attendances', { args: { limit: status.limit } });
      throw new HttpException(message, HttpStatus.BAD_REQUEST);
    }

    bookEntity.massTime = status.massTime;
    bookEntity.createAt = new Date();

    if (!(await this.bookService.hasDuplicateName(bookEntity.massTime, bookEntity))) {
      const message = await i18n.translate('message.name already registered');
      throw new HttpException(message, HttpStatus.BAD_REQUEST);
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
