// Pure functions for blocking logic - testable without extension context

function isTimeBlocked(rule, now ){
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentTime = hours * 60 + minutes;

  const startTime = startHour * 60 + startMin;
  const endTime = endHour * 60 + endMin;

  if (startTime <= endTime) {
    return currentTime >= startTime && currentTime < endTime;
  } else {
    return currentTime >= startTime || currentTime < endTime;
  }
}

function urlMatches(pattern, url){
  const regex = new RegExp(pattern.replace(/\*/g, '.*'));
  return regex.test(url);
}

function isDailyLimitExceeded(, visitCount){
  if (!rule.dailyLimit) return false;
  return visitCount >= rule.dailyLimit;
}

export { isTimeBlocked, urlMatches, isDailyLimitExceeded };
