/** Planned care for one pet, such as a vet visit. Starts and ends on the same day. */
export type CalendarEvent = {
  id: string;
  petId: string;
  title: string;
  /** ISO timestamps in UTC; endsAt is always after startsAt. */
  startsAt: string;
  endsAt: string;
  location?: string;
  description?: string;
  createdAt: string;
};

export type NewCalendarEvent = Omit<CalendarEvent, 'id' | 'createdAt'>;
