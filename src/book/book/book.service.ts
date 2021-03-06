import { Injectable } from '@nestjs/common';
import { Day, Mass } from '../interfaces/mass';
import { DayOfWeekEnum } from '../interfaces/day-of-week.enum';
import { BookEntity } from '../book.entity';
import { InsertResult, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class BookService {
  static MASS_LIMIT = 60;
  private masses: Mass[] = [
    {
      availableFrom: {
        dayOfWeek: DayOfWeekEnum.Sunday,
        hour: 0,
        minute: 0,
      },
      limit: BookService.MASS_LIMIT,
      time: {
        dayOfWeek: DayOfWeekEnum.Tuesday,
        minute: 0,
        hour: 10,
      },
    },
    {
      availableFrom: {
        dayOfWeek: DayOfWeekEnum.Friday,
        hour: 7,
        minute: 0,
      },
      limit: BookService.MASS_LIMIT,
      time: {
        dayOfWeek: DayOfWeekEnum.Sunday,
        minute: 0,
        hour: 19,
      },
    },
  ];

  constructor(@InjectRepository(BookEntity) private bookRepository: Repository<BookEntity>) {}

  private static getNextDayOfWeek(date: Date, dayOfWeek: number) {
    const resultDate = new Date(date.getTime());

    if (resultDate.getDay() === dayOfWeek) {
      return resultDate;
    }

    resultDate.setDate(date.getDate() + ((7 + dayOfWeek - date.getDay()) % 7));
    return resultDate;
  }

  static DayToDate(day: Day): Date {
    const date = BookService.getNextDayOfWeek(new Date(), day.dayOfWeek);
    date.setHours(day.hour);
    date.setMinutes(day.minute);
    date.setSeconds(0);
    date.setMilliseconds(0);
    return date;
  }

  private static timeInRange(time: Date, from: Day, to: Day): boolean {
    const toDate = BookService.DayToDate(to);

    if (toDate < time) {
      toDate.setDate(toDate.getDate() + 7);
    }

    const fromDate = new Date(toDate.getTime());
    fromDate.setDate(fromDate.getDate() + from.dayOfWeek - to.dayOfWeek);
    fromDate.setHours(fromDate.getHours() + from.hour - to.hour);
    fromDate.setMinutes(fromDate.getMinutes() + from.minute - to.minute);

    if (toDate < fromDate) {
      fromDate.setDate(fromDate.getDate() - 7);
    }

    return !(time.valueOf() > toDate.valueOf() || time.valueOf() < fromDate.valueOf());
  }

  getDateStatus(): Mass {
    const now = new Date();

    for (const mass of this.masses) {
      const to = { ...mass.time, hour: mass.time.hour - 3 };

      if (BookService.timeInRange(now, mass.availableFrom, to)) {
        return mass;
      }
    }

    return;
  }

  async getLimit(massTime: Date): Promise<number> {
    const masses = await this.bookRepository.find({ massTime });

    let count = 0;

    for (const mass of masses) {
      count += mass.otherPeople.length + 1;
    }

    return BookService.MASS_LIMIT - count;
  }

  async book(bookEntity: BookEntity): Promise<InsertResult> {
    return this.bookRepository.insert(bookEntity);
  }

  getBook(id: string): Promise<BookEntity> {
    return this.bookRepository.findOne(id);
  }

  getDates() {
    return this.bookRepository.find({
      select: ['massTime'],
      order: { massTime: 'ASC' },
    });
  }

  attendees(massTime: string | Date) {
    return this.bookRepository.find({ massTime: new Date(massTime) });
  }

  async hasDuplicateName(massTime: string | Date, book: BookEntity) {
    const attendees = await this.attendees(massTime);
    const names = [book.name, ...book.otherPeople];
    const uniqueNames = [...new Set(names)];

    if (uniqueNames.length !== names.length) {
      return false;
    }

    for (const attend of attendees) {
      if (attend.phone === book.phone) {
        return false;
      }

      if (names.includes(attend.name)) {
        return false;
      }

      for (const other of attend.otherPeople) {
        if (names.includes(other)) {
          return false;
        }
      }
    }

    return true;
  }
}
