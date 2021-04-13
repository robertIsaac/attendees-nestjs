import { Injectable } from '@nestjs/common';
import { BookEntity } from '../book.entity';
import { DeleteResult, InsertResult, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Mass } from '../../mass/entities/mass.entity';

@Injectable()
export class BookService {
  constructor(@InjectRepository(BookEntity) private bookRepository: Repository<BookEntity>) {}

  async getLimit(mass: Mass): Promise<number> {
    const bookEntities = await this.bookRepository.find({ massId: mass.id });

    let count = 0;

    for (const bookEntity of bookEntities) {
      count += bookEntity.otherPeople.length + 1;
    }

    return mass.limit - count;
  }

  async book(bookEntity: BookEntity): Promise<InsertResult> {
    return this.bookRepository.insert(bookEntity);
  }

  getBook(id: string): Promise<BookEntity> {
    return this.bookRepository.findOne(id);
  }

  deleteBook(id: string): Promise<DeleteResult> {
    return this.bookRepository.delete(id);
  }

  async updateBook(bookEntity: Partial<BookEntity>): Promise<DeleteResult | false> {
    const attendees = await this.bookRepository.find({
      where: {
        massId: new Date(bookEntity.massId).toISOString(),
        id: { $not: { $eq: bookEntity.id } },
      },
    });

    if (BookService.attendeesHasDuplicate(attendees, bookEntity)) {
      return false;
    } else {
      return await this.bookRepository.update(bookEntity.id, bookEntity);
    }
  }

  attendees(massId: string): Promise<BookEntity[]> {
    return this.bookRepository.find({ massId });
  }

  async hasDuplicateName(massId: string, book: BookEntity): Promise<boolean> {
    const attendees = await this.attendees(massId);
    return !BookService.attendeesHasDuplicate(attendees, book);
  }

  async getAttendanceByPhone(phone: string): Promise<BookEntity> {
    return this.bookRepository.findOne({ phone });
  }

  private static attendeesHasDuplicate(attendees: BookEntity[], book: Partial<BookEntity>): boolean {
    const names = [book.name, ...book.otherPeople];
    const uniqueNames = [...new Set(names)];

    if (uniqueNames.length !== names.length) {
      return true;
    }

    for (const attend of attendees) {
      if (attend.phone === book.phone) {
        return true;
      }

      if (names.includes(attend.name)) {
        return true;
      }

      for (const other of attend.otherPeople) {
        if (names.includes(other)) {
          return true;
        }
      }
    }

    return false;
  }
}
