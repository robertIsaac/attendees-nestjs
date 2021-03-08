import { Injectable } from '@nestjs/common';
import { Day, Mass } from '../interfaces/mass';
import { DayOfWeekEnum } from '../interfaces/day-of-week.enum';

@Injectable()
export class BookService {
  private masses: Mass[] = [
    {
      availableFrom: {
        dayOfWeek: DayOfWeekEnum.Wednesday,
        hour: 0,
        minute: 0,
      },
      limit: 50,
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
      limit: 50,
      time: {
        dayOfWeek: DayOfWeekEnum.Sunday,
        minute: 0,
        hour: 19,
      },
    },
  ];

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

  getDateStatus(): Mass | false {
    const now = new Date();

    for (const mass of this.masses) {
      const to = { ...mass.time, hour: mass.time.hour - 3 };

      if (BookService.timeInRange(now, mass.availableFrom, to)) {
        return mass;
      }
    }

    return false;
  }
}
