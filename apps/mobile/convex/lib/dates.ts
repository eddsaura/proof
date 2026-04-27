const calendarDatePattern = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseCalendarDate(value: string) {
  const match = calendarDatePattern.exec(value.trim());

  if (!match) {
    return undefined;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const timestamp = Date.UTC(year, month - 1, day);
  const date = new Date(timestamp);

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return undefined;
  }

  return formatCalendarDateInput(date);
}

export function normalizeCalendarDate(value: string | undefined) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return undefined;
  }

  return parseCalendarDate(trimmed);
}

export function normalizeCalendarDateRange({
  startsOn,
  endsOn,
}: {
  startsOn: string | undefined;
  endsOn: string | undefined;
}) {
  const normalizedStartsOn = normalizeCalendarDate(startsOn);
  const normalizedEndsOn = normalizeCalendarDate(endsOn);

  if (startsOn?.trim() && normalizedStartsOn === undefined) {
    throw new Error("Use a real start date in YYYY-MM-DD format.");
  }

  if (endsOn?.trim() && normalizedEndsOn === undefined) {
    throw new Error("Use a real end date in YYYY-MM-DD format.");
  }

  if (
    normalizedStartsOn !== undefined &&
    normalizedEndsOn !== undefined &&
    normalizedEndsOn < normalizedStartsOn
  ) {
    throw new Error("The end date cannot be before the start date.");
  }

  return {
    startsOn: normalizedStartsOn,
    endsOn: normalizedEndsOn,
  };
}

export function formatCalendarDateInput(value?: Date | string) {
  if (value === undefined || value === "") {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  const year = value.getUTCFullYear();
  const month = `${value.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${value.getUTCDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function formatShortCalendarDate(value?: string) {
  if (!value) {
    return null;
  }

  const normalizedDate = parseCalendarDate(value);

  if (!normalizedDate) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${normalizedDate}T00:00:00.000Z`));
}
