// Pure functions for blocking logic - testable without extension context

function isTimeBlocked(rule, now = new Date()) {
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentTime = hours * 60 + minutes;

  const [startHour, startMin] = rule.startTime.split(':').map(Number);
  const [endHour, endMin] = rule.endTime.split(':').map(Number);

  const startTime = startHour * 60 + startMin;
  const endTime = endHour * 60 + endMin;

  if (startTime <= endTime) {
    return currentTime >= startTime && currentTime < endTime;
  } else {
    return currentTime >= startTime || currentTime < endTime;
  }
}

function urlMatches(pattern, url) {
  const regex = new RegExp(pattern.replace(/\*/g, '.*'));
  return regex.test(url);
}

function isDailyLimitExceeded(rule, visitCount) {
  if (!rule.dailyLimit) return false;
  return visitCount >= rule.dailyLimit;
}

module.exports = { isTimeBlocked, urlMatches, isDailyLimitExceeded };
