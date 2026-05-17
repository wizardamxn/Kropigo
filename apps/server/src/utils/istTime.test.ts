import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getISTTime, isInWindow } from './istTime';

// Helper to create a date object that will evaluate to a specific IST time
// Since Intl.DateTimeFormat formats based on the provided date's UTC timestamp,
// we just need to construct a Date by manually setting the UTC offset.
function createISTDate(hour: number, minute: number): Date {
  // IST is UTC + 5:30.
  // So to get a specific IST time, we subtract 5 hours and 30 minutes to get the UTC time.
  const date = new Date();
  
  // Set time in UTC
  let utcHour = hour - 5;
  let utcMinute = minute - 30;
  
  if (utcMinute < 0) {
    utcMinute += 60;
    utcHour -= 1;
  }
  if (utcHour < 0) {
    utcHour += 24;
  }

  date.setUTCHours(utcHour, utcMinute, 0, 0);
  return date;
}

describe('IST Time Utility', () => {
  describe('getISTTime', () => {
    it('should correctly parse 9:59 AM IST', () => {
      const d = createISTDate(9, 59);
      const res = getISTTime(d);
      assert.strictEqual(res.hour, 9);
      assert.strictEqual(res.minute, 59);
    });

    it('should correctly parse 5:00 PM (17:00) IST', () => {
      const d = createISTDate(17, 0);
      const res = getISTTime(d);
      assert.strictEqual(res.hour, 17);
      assert.strictEqual(res.minute, 0);
    });
  });

  describe('isInWindow(10, 17)', () => {
    it('should return false for 9:59 AM', () => {
      const d = createISTDate(9, 59);
      assert.strictEqual(isInWindow(10, 17, d), false);
    });

    it('should return true for 10:00 AM', () => {
      const d = createISTDate(10, 0);
      assert.strictEqual(isInWindow(10, 17, d), true);
    });

    it('should return true for 4:59 PM (16:59)', () => {
      const d = createISTDate(16, 59);
      assert.strictEqual(isInWindow(10, 17, d), true);
    });

    it('should return false for 5:00 PM (17:00)', () => {
      const d = createISTDate(17, 0);
      assert.strictEqual(isInWindow(10, 17, d), false);
    });
  });
});
