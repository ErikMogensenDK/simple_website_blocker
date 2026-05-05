// Pure functions for blocking logic - testable without extension context

interface Rule {
  startTime?: string;
  endTime?: string;
  dailyLimit?: number | null;
}

function isTimeBlocked(rule: Rule, now: Date = new Date()): boolean {
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentTime = hours * 60 + minutes;

  const [startHour, startMin] = rule.startTime!.split(':').map(Number);
  const [endHour, endMin] = rule.endTime!.split(':').map(Number);

  const startTime = startHour * 60 + startMin;
  const endTime = endHour * 60 + endMin;

  if (startTime <= endTime) {
    return currentTime >= startTime && currentTime < endTime;
  } else {
    return currentTime >= startTime || currentTime < endTime;
  }
}

function urlMatches(pattern: string, url: string): boolean {
  const regex = new RegExp(pattern.replace(/\*/g, '.*'));
  return regex.test(url);
}

function isDailyLimitExceeded(rule: Rule, visitCount: number): boolean {
  if (!rule.dailyLimit) return false;
  return visitCount >= rule.dailyLimit;
}

export { isTimeBlocked, urlMatches, isDailyLimitExceeded };
