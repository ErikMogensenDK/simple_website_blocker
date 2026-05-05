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

// Check if daily visit limit exceeded
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

// Check if daily time limit exceeded
async function isDailyTimeExceeded(rule) {
  if (!rule.dailyTimeLimit) return false;

  const data = await chrome.storage.local.get(`timeSpent_${rule.id}`);
  const today = new Date().toDateString();
  const timeSpent = data[`timeSpent_${rule.id}`] || { date: today, minutes: 0 };

  console.log(`Checking time limit for rule ${rule.id}: current time spent = ${timeSpent.minutes} minutes, limit = ${rule.dailyTimeLimit} minutes`);

  if (timeSpent.date !== today) {
    console.log('New day, resetting time spent');
    return false; // New day, reset
  }

  const exceeded = timeSpent.minutes >= rule.dailyTimeLimit;
  console.log(`Time limit exceeded: ${exceeded}`);
  return exceeded;
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
  console.log(`Incremented visits for rule ${ruleId}: ${visits.count}`);
  await chrome.storage.local.set({ [`visits_${ruleId}`]: visits });
}

// Increment time spent
async function incrementTime(ruleId, minutes) {
  const today = new Date().toDateString();
  const data = await chrome.storage.local.get(`timeSpent_${ruleId}`);
  const timeSpent = data[`timeSpent_${ruleId}`] || { date: today, minutes: 0 };

  if (timeSpent.date !== today) {
    timeSpent.minutes = 0;
    timeSpent.date = today;
  }

  timeSpent.minutes += minutes;
  console.log(`INCREMENT_TIME: Rule ${ruleId} - Added ${minutes} minutes, total now: ${timeSpent.minutes} minutes`);
  await chrome.storage.local.set({ [`timeSpent_${ruleId}`]: timeSpent });
}

// Main blocking logic
async function checkIfBlocked(url) {
  console.log('Checking if blocked:', url);
  const data = await chrome.storage.local.get('rules');
  const rules = data.rules || [];
  console.log('Rules:', rules);

  for (let rule of rules) {
    if (!rule.enabled) continue;

    console.log('Checking rule:', rule);
    // Check if URL matches pattern
    const pattern = new RegExp(rule.pattern.replace(/\*/g, '.*'));
    console.log('Pattern:', pattern, 'Test result:', pattern.test(url));
    if (!pattern.test(url)) continue;

    console.log('URL matches, checking block type:', rule.blockType);

    // Check time-based blocking
    if (rule.blockType === 'time' && isTimeBlocked(rule)) {
      console.log('Blocked by time rule');
      return { blocked: true, reason: `Blocked ${rule.startTime}-${rule.endTime}` };
    }

    // Check daily visit limit blocking
    if (rule.blockType === 'daily') {
      const exceeded = await isDailyLimitExceeded(rule);
      console.log('Daily limit exceeded:', exceeded);
      if (exceeded) {
        return { blocked: true, reason: `Daily visit limit (${rule.dailyLimit}) reached` };
      }
      await incrementVisits(rule.id);
      console.log('Visit incremented, allowing access');
      return { blocked: false };
    }

    // Check daily time limit blocking
    if (rule.blockType === 'duration') {
      const exceeded = await isDailyTimeExceeded(rule);
      console.log('Time limit exceeded:', exceeded);
      if (exceeded) {
        return { blocked: true, reason: `Daily time limit (${Math.floor(rule.dailyTimeLimit / 60)}h ${rule.dailyTimeLimit % 60}m) reached` };
      }
      console.log('Starting time tracking for duration rule:', rule.id, '- time limit not exceeded yet');
      return { blocked: false, ruleId: rule.id };
    }
  }

  console.log('No matching rules, allowing access');
  return { blocked: false };
}

chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'CHECK_BLOCK') {
    checkIfBlocked(request.url).then(result => sendResponse(result));
    return true; // Keep channel open for async response
  }
  if (request.type === 'INCREMENT_TIME') {
    console.log('Incrementing time:', request);
    incrementTime(request.ruleId, request.minutes);
    sendResponse({ success: true });
    return true;
  }
});
