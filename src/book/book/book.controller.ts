import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { BookService } from './book.service';
import { BookEntity } from '../book.entity';
import { I18n, I18nContext } from 'nestjs-i18n';
import { AuthGuard } from '@nestjs/passport';
import { MassService } from '../../mass/mass.service';
import { Mass } from '../../mass/entities/mass.entity';

@Controller('book')
export class BookController {
  constructor(private bookService: BookService, private massService: MassService) {}

  @Get('status')
  async status(
    @I18n() i18n: I18nContext,
  ): Promise<{ canBook: true; masses: Mass[] } | { canBook: false; message: string }> {
    const availableMasses = await this.massService.findAvailable();
    console.log(availableMasses);
    if (availableMasses.length === 0) {
      const message = await i18n.translate('message.no available masses');
      return {
        canBook: false,
        message,
      };
    }

    const massesWithLimit: Mass[] = [];
    for (const mass of availableMasses) {
      const limit = await this.bookService.getLimit(mass);
      if (limit) {
        mass.limit = limit;
        massesWithLimit.push(mass);
      }
    }

    if (massesWithLimit.length == 0) {
      const message = await i18n.translate('message.mass limit reached');
      return {
        canBook: false,
        message,
      };
    }

    return {
      canBook: true,
      masses: massesWithLimit,
    };
  }

  @Post('')
  async book(@Body() bookEntity: BookEntity, @I18n() i18n: I18nContext) {
    const mass = await this.massService.findOne(bookEntity.massId);

    if (!mass) {
      throw new HttpException('there is no available mass to book', HttpStatus.BAD_REQUEST);
    }

    const limit = await this.bookService.getLimit(mass);

    if (bookEntity.otherPeople.length >= limit) {
      const message = await i18n.translate('message.maximum allowed attendances', { args: { limit } });
      throw new HttpException(message, HttpStatus.BAD_REQUEST);
    }

    bookEntity.createAt = new Date();

    if (!(await this.bookService.hasDuplicateName(bookEntity.massId, bookEntity))) {
      const message = await i18n.translate('message.name already registered');
      throw new HttpException(message, HttpStatus.BAD_REQUEST);
    }

    const result = await this.bookService.book(bookEntity);

    if (result) {
      return this.bookService.getBook(result.identifiers[0].id);
    }

    throw new HttpException('something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('attendees/:massId')
  async attendees(@Param('massId') massId: string) {
    return this.bookService.attendees(massId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('attendanceByPhone/:phone')
  async attendanceByPhone(@Param('phone') phone: string) {
    return this.bookService.getAttendanceByPhone(phone);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  async findOne(@Param('id') id: string, @I18n() i18n: I18nContext): Promise<BookEntity> {
    const book = await this.bookService.getBook(id);
    if (!book) {
      const message = await i18n.translate(`book not found`);
      throw new HttpException(message, HttpStatus.NOT_FOUND);
    }
    return book;
  }

  @UseGuards(AuthGuard('jwt'))
  @Put(':id')
  @HttpCode(204)
  async update(@Param('id') id: string, @Body() bookEntity: BookEntity, @I18n() i18n: I18nContext): Promise<void> {
    const book = await this.bookService.getBook(id);
    if (!book) {
      const message = await i18n.translate(`book not found`);
      throw new HttpException(message, HttpStatus.NOT_FOUND);
    }
    const updatedEntity: BookEntity = {
      ...book,
      id,
      phone: bookEntity.phone,
      name: bookEntity.name,
      otherPeople: bookEntity.otherPeople,
    };
    const response = await this.bookService.updateBook(updatedEntity);

    if (response === false) {
      const message = await i18n.translate(`an error occurred`);
      throw new HttpException(message, HttpStatus.BAD_REQUEST);
    }

    return;
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string, @I18n() i18n: I18nContext): Promise<void> {
    const book = await this.bookService.getBook(id);
    if (!book) {
      const message = await i18n.translate(`book not found`);
      throw new HttpException(message, HttpStatus.NOT_FOUND);
    }
    await this.bookService.deleteBook(id);
    return;
  }
}
