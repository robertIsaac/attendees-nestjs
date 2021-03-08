export interface Mass {
  time: Day;
  limit: number;
  availableFrom: Day;
}

export interface Day {
  dayOfWeek: number;
  hour: number;
  minute: number;
}
