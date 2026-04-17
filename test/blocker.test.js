const { test } = require('node:test');
const assert = require('node:assert');
const { isTimeBlocked, urlMatches, isDailyLimitExceeded } = require('../lib/blocker.js');

test('Time blocking - within blocked hours', () => {
  const rule = { startTime: '09:00', endTime: '17:00' };
  const now = new Date(2026, 3, 17, 10, 30); // 10:30 AM
  assert.strictEqual(isTimeBlocked(rule, now), true);
});

test('Time blocking - before blocked hours', () => {
  const rule = { startTime: '09:00', endTime: '17:00' };
  const now = new Date(2026, 3, 17, 8, 30); // 8:30 AM
  assert.strictEqual(isTimeBlocked(rule, now), false);
});

test('Time blocking - after blocked hours', () => {
  const rule = { startTime: '09:00', endTime: '17:00' };
  const now = new Date(2026, 3, 17, 18, 0); // 6:00 PM
  assert.strictEqual(isTimeBlocked(rule, now), false);
});

test('Time blocking - wraps midnight start', () => {
  const rule = { startTime: '22:00', endTime: '06:00' };
  const now = new Date(2026, 3, 17, 23, 30); // 11:30 PM
  assert.strictEqual(isTimeBlocked(rule, now), true);
});

test('Time blocking - wraps midnight end', () => {
  const rule = { startTime: '22:00', endTime: '06:00' };
  const now = new Date(2026, 3, 17, 4, 0); // 4:00 AM
  assert.strictEqual(isTimeBlocked(rule, now), true);
});

test('URL matching - exact domain', () => {
  assert.strictEqual(urlMatches('*reddit.com*', 'https://reddit.com/r/test'), true);
});

test('URL matching - wildcard', () => {
  assert.strictEqual(urlMatches('*twitter.com*', 'https://twitter.com/home'), true);
});

test('URL matching - no match', () => {
  assert.strictEqual(urlMatches('*reddit.com*', 'https://google.com'), false);
});

test('Daily limit - not exceeded', () => {
  const rule = { dailyLimit: 5 };
  assert.strictEqual(isDailyLimitExceeded(rule, 3), false);
});

test('Daily limit - at limit', () => {
  const rule = { dailyLimit: 5 };
  assert.strictEqual(isDailyLimitExceeded(rule, 5), true);
});

test('Daily limit - exceeded', () => {
  const rule = { dailyLimit: 5 };
  assert.strictEqual(isDailyLimitExceeded(rule, 6), true);
});

test('Daily limit - no limit set', () => {
  const rule = { dailyLimit: null };
  assert.strictEqual(isDailyLimitExceeded(rule, 100), false);
});
