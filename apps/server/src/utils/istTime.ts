/**
 * Gets the current hour and minute in Indian Standard Time (IST).
 * Avoids using new Date().getHours() which relies on server timezone.
 *
 * @param date Optional date to check. Defaults to now.
 * @returns { hour: number, minute: number } in 24-hour format
 */
export function getISTTime(date: Date = new Date()): { hour: number; minute: number } {
  const formatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false, // Force 24-hour format
  });

  const timeString = formatter.format(date);
  const [hourStr, minuteStr] = timeString.split(':');
  
  let hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  // Intl sometimes returns 24 for midnight depending on node version
  if (hour === 24) hour = 0;

  return { hour, minute };
}

/**
 * Checks if the current (or given) IST time falls strictly within the specified window.
 * 
 * @param startHour The beginning hour (inclusive) in 24h format (e.g., 10 for 10 AM)
 * @param endHour The ending hour (exclusive) in 24h format (e.g., 17 for 5 PM)
 * @param date Optional Date to check
 * @returns boolean
 */
export function isInWindow(startHour: number, endHour: number, date: Date = new Date()): boolean {
  const { hour } = getISTTime(date);
  
  // Example window 10 to 17:
  // 9:59 => hour 9 -> false
  // 10:00 => hour 10 -> true
  // 16:59 => hour 16 -> true
  // 17:00 => hour 17 -> false
  return hour >= startHour && hour < endHour;
}
