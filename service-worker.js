// Check if current time falls within blocked period
function isTimeBlocked(rule) {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentTime = hours * 60 + minutes; // Convert to minutes since midnight

  const [startHour, startMin] = rule.startTime.split(':').map(Number);
  const [endHour, endMin] = rule.endTime.split(':').map(Number);

  const startTime = startHour * 60 + startMin;
  const endTime = endHour * 60 + endMin;

  if (startTime <= endTime) {
    return currentTime >= startTime && currentTime < endTime;
  } else {
    // Block wraps midnight
    return currentTime >= startTime || currentTime < endTime;
  }
}

// Check if daily limit exceeded
async function isDailyLimitExceeded(rule) {
  if (!rule.dailyLimit) return false;

  const data = await chrome.storage.local.get(`visits_${rule.id}`);
  const today = new Date().toDateString();
  const visits = data[`visits_${rule.id}`] || { date: today, count: 0 };

  if (visits.date !== today) {
    return false; // New day, reset
  }

  return visits.count >= rule.dailyLimit;
}

// Increment visit counter
async function incrementVisits(ruleId) {
  const today = new Date().toDateString();
  const data = await chrome.storage.local.get(`visits_${ruleId}`);
  const visits = data[`visits_${ruleId}`] || { date: today, count: 0 };

  if (visits.date !== today) {
    visits.count = 0;
    visits.date = today;
  }

  visits.count++;
  await chrome.storage.local.set({ [`visits_${ruleId}`]: visits });
}

// Main blocking logic
async function checkIfBlocked(url) {
  const data = await chrome.storage.local.get('rules');
  const rules = data.rules || [];

  for (let rule of rules) {
    if (!rule.enabled) continue;

    // Check if URL matches pattern
    const pattern = new RegExp(rule.pattern.replace(/\*/g, '.*'));
    if (!pattern.test(url)) continue;

    // Check time-based blocking
    if (rule.blockType === 'time' && isTimeBlocked(rule)) {
      return { blocked: true, reason: `Blocked ${rule.startTime}-${rule.endTime}` };
    }

    // Check daily limit blocking
    if (rule.blockType === 'daily') {
      if (await isDailyLimitExceeded(rule)) {
        return { blocked: true, reason: `Daily limit (${rule.dailyLimit}) reached` };
      }
      await incrementVisits(rule.id);
    }
  }

  return { blocked: false };
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'CHECK_BLOCK') {
    checkIfBlocked(request.url).then(result => sendResponse(result));
    return true; // Keep channel open for async response
  }
});
