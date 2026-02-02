/**
 * Timezone utilities for Bangkok/Thailand (GMT+7)
 * 
 * This ensures consistent timezone handling across the application,
 * especially when deployed on Vercel where server timezone is UTC.
 */

const BANGKOK_TIMEZONE = 'Asia/Bangkok';

/**
 * Format a date string to Bangkok timezone
 * @param dateString - ISO date string or Date object
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string in Bangkok timezone
 */
export function toThaiDateTime(
  dateString: string | Date,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: BANGKOK_TIMEZONE,
    ...options,
  };

  return date.toLocaleString('th-TH', defaultOptions);
}

/**
 * Format a date to Thai date format (Bangkok timezone)
 * @param dateString - ISO date string or Date object
 * @returns Formatted date string
 */
export function toThaiDate(dateString: string | Date): string {
  return toThaiDateTime(dateString, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format a date to short Thai date format (Bangkok timezone)
 * @param dateString - ISO date string or Date object
 * @returns Formatted date string (e.g., "1 ม.ค. 2567")
 */
export function toThaiDateShort(dateString: string | Date): string {
  return toThaiDateTime(dateString, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format time to Thai format (Bangkok timezone)
 * @param dateString - ISO date string or Date object
 * @returns Formatted time string (e.g., "14:30:00")
 */
export function toThaiTime(dateString: string | Date): string {
  return toThaiDateTime(dateString, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Format time to short Thai format (Bangkok timezone)
 * @param dateString - ISO date string or Date object
 * @returns Formatted time string (e.g., "14:30")
 */
export function toThaiTimeShort(dateString: string | Date): string {
  return toThaiDateTime(dateString, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get current date in Bangkok timezone
 * @returns Date object
 */
export function getBangkokDate(): Date {
  // Create a date in Bangkok timezone
  const bangkokTimeString = new Date().toLocaleString('en-US', {
    timeZone: BANGKOK_TIMEZONE,
  });
  return new Date(bangkokTimeString);
}

/**
 * Convert a date to Bangkok timezone Date object
 * @param dateString - ISO date string or Date object
 * @returns Date object representing the same moment in Bangkok timezone
 */
export function toBangkokDate(dateString: string | Date): Date {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const bangkokTimeString = date.toLocaleString('en-US', {
    timeZone: BANGKOK_TIMEZONE,
  });
  return new Date(bangkokTimeString);
}

/**
 * Format a date with custom options in Bangkok timezone
 * @param dateString - ISO date string or Date object
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export function formatBangkokDate(
  dateString: string | Date,
  options: Intl.DateTimeFormatOptions
): string {
  return toThaiDateTime(dateString, options);
}
