import { Injectable } from '@nestjs/common';
import { Day, Mass } from '../interfaces/mass';
import { DayOfWeekEnum } from '../interfaces/day-of-week.enum';
import { BookEntity } from '../book.entity';
import { InsertResult, Repository } from 'typeorm';

@Injectable()
export class BookService {
  static MASS_LIMIT = 50;
  private masses: Mass[] = [
    {
      availableFrom: {
        dayOfWeek: DayOfWeekEnum.Wednesday,
        hour: 0,
        minute: 0,
      },
      limit: BookService.MASS_LIMIT,
      time: {
        dayOfWeek: DayOfWeekEnum.Friday,
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

  constructor(private bookRepository: Repository<BookEntity>) {}

  private static getNextDayOfWeek(date: Date, dayOfWeek: number) {
    const resultDate = new Date(date.getTime());

    if (resultDate.getDay() === dayOfWeek) {
      return resultDate;
    }

    resultDate.setDate(date.getDate() + ((7 + dayOfWeek - date.getDay()) % 7));
    return resultDate;
  }

  private static timeInRange(time: Date, from: Day, to: Day): boolean {
    const toDate = BookService.getNextDayOfWeek(time, to.dayOfWeek);
    toDate.setHours(to.hour);
    toDate.setMinutes(to.minute);

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
    const status = this.getDateStatus();

    if (!status) {
      return;
    }

    const limit = await this.getLimit(bookEntity.massTime);

    if (limit <= bookEntity.otherPeople.length) {
      return;
    }

    return this.bookRepository.insert(bookEntity);
  }
}
