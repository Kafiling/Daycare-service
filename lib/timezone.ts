/**
 * Timezone utilities for Bangkok/Thailand (GMT+7)
 * 
 * This ensures consistent timezone handling across the application,
 * especially when deployed on Vercel where server timezone is UTC.
 * 
 * Uses date-fns-tz for reliable timezone conversions in serverless environments.
 */

import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { th } from 'date-fns/locale';

const BANGKOK_TIMEZONE = 'Asia/Bangkok';

/**
 * Format a date string to Bangkok timezone
 * @param dateString - ISO date string or Date object
 * @param options - Intl.DateTimeFormatOptions (converted to date-fns format)
 * @returns Formatted date string in Bangkok timezone
 */
export function toThaiDateTime(
  dateString: string | Date,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  // If no options provided, use default format
  if (!options) {
    return formatInTimeZone(date, BANGKOK_TIMEZONE, 'PPpp', { locale: th });
  }

  // Convert Intl options to date-fns format string
  let formatString = '';
  
  if (options.year === 'numeric') formatString += 'yyyy';
  else if (options.year === '2-digit') formatString += 'yy';
  
  if (options.month === 'long') formatString += ' MMMM';
  else if (options.month === 'short') formatString += ' MMM';
  else if (options.month === 'numeric') formatString += '/MM';
  else if (options.month === '2-digit') formatString += '/MM';
  
  if (options.day === 'numeric') formatString += ' d';
  else if (options.day === '2-digit') formatString += ' dd';
  
  if (options.hour === '2-digit' || options.hour === 'numeric') {
    formatString += ' HH';
  }
  if (options.minute === '2-digit' || options.minute === 'numeric') {
    formatString += ':mm';
  }
  if (options.second === '2-digit' || options.second === 'numeric') {
    formatString += ':ss';
  }
  
  formatString = formatString.trim();
  
  return formatInTimeZone(date, BANGKOK_TIMEZONE, formatString, { locale: th });
}

/**
 * Format a date to Thai date format (Bangkok timezone)
 * @param dateString - ISO date string or Date object
 * @returns Formatted date string (e.g., "2 กุมภาพันธ์ 2569")
 */
export function toThaiDate(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return formatInTimeZone(date, BANGKOK_TIMEZONE, 'd MMMM yyyy', { locale: th });
}

/**
 * Format a date to short Thai date format (Bangkok timezone)
 * @param dateString - ISO date string or Date object
 * @returns Formatted date string (e.g., "1 ม.ค. 2569")
 */
export function toThaiDateShort(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return formatInTimeZone(date, BANGKOK_TIMEZONE, 'd MMM yyyy', { locale: th });
}

/**
 * Format time to Thai format (Bangkok timezone)
 * @param dateString - ISO date string or Date object
 * @returns Formatted time string (e.g., "14:30:00")
 */
export function toThaiTime(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return formatInTimeZone(date, BANGKOK_TIMEZONE, 'HH:mm:ss', { locale: th });
}

/**
 * Format time to short Thai format (Bangkok timezone)
 * @param dateString - ISO date string or Date object
 * @returns Formatted time string (e.g., "14:30")
 */
export function toThaiTimeShort(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return formatInTimeZone(date, BANGKOK_TIMEZONE, 'HH:mm', { locale: th });
}

/**
 * Get current date in Bangkok timezone
 * @returns Date object
 */
export function getBangkokDate(): Date {
  return toZonedTime(new Date(), BANGKOK_TIMEZONE);
}

/**
 * Convert a date string to Bangkok timezone Date object
 * @param dateString - ISO date string or Date object
 * @returns Date object adjusted to Bangkok timezone
 */
export function toBangkokDate(dateString: string | Date): Date {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return toZonedTime(date, BANGKOK_TIMEZONE);
}

/**
 * Format a date with custom format string in Bangkok timezone
 * @param dateString - ISO date string or Date object
 * @param formatStr - date-fns format string (default: 'PPpp')
 * @returns Formatted date string
 */
export function formatBangkokDate(
  dateString: string | Date,
  formatStr: string = 'PPpp'
): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return formatInTimeZone(date, BANGKOK_TIMEZONE, formatStr, { locale: th });
}
