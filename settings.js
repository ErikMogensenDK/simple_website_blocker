const patternInput = document.getElementById('pattern');
const blockTypeSelect = document.getElementById('blockType');
const timeOptionsDiv = document.getElementById('timeOptions');
const visitOptionsDiv = document.getElementById('visitOptions');
const durationOptionsDiv = document.getElementById('durationOptions');
const startTimeInput = document.getElementById('startTime');
const endTimeInput = document.getElementById('endTime');
const dailyLimitInput = document.getElementById('dailyLimit');
const hoursInput = document.getElementById('hours');
const minutesInput = document.getElementById('minutes');
const addBtn = document.getElementById('addBtn');
const rulesList = document.getElementById('rulesList');
const captchaOverlay = document.getElementById('captchaOverlay');
const captchaGrid = document.getElementById('captchaGrid');
const captchaError = document.getElementById('captchaError');
const captchaCancel = document.getElementById('captchaCancel');
const captchaConfirm = document.getElementById('captchaConfirm');

const captchaImages = [
  'chihuahua/chihuahua1.png',
  'chihuahua/chihuahua3.png',
  'chihuahua/chihuahua4.png',
  'chihuahua/chihuahua5.webp',
  'chihuahua/chihuahua6.webp',
  'chihuahua/chihuahua7.webp',
  'chihuahua/chihuahua8.webp',
  'chihuahua/chihuahua9.webp',
  'chihuahua/Muffin6.webp',
  'chihuahua/cupcake1.png',
  'chihuahua/cupcake2.png',
  'chihuahua/cupcake3.webp',
  'chihuahua/cupcake4.webp',
  'chihuahua/cupcake5.webp',
  'chihuahua/cupcake8.png',
  'chihuahua/cupcake7.webp',
];
const correctImages = new Set(captchaImages.filter((img) => img.split('/').pop().toLowerCase().includes('chihuahua')));
let pendingAction = null;

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function renderCaptchaGrid() {
  const images = shuffle(captchaImages);
  captchaGrid.innerHTML = images
    .map(
      (src) => `
      <button type="button" class="captcha-tile" data-image="${src}">
        <img src="${src}" alt="Captcha option">
      </button>
    `
    )
    .join('');
}

function showCaptcha(actionType, ruleId) {
  pendingAction = { actionType, ruleId };
  captchaError.textContent = '';
  renderCaptchaGrid();
  captchaOverlay.classList.add('active');
}

function hideCaptcha() {
  pendingAction = null;
  captchaOverlay.classList.remove('active');
}

function validateCaptcha() {
  const selected = Array.from(captchaGrid.querySelectorAll('.captcha-tile.selected')).map((tile) => tile.dataset.image);
  const selectedSet = new Set(selected);

  if (selectedSet.size !== correctImages.size) {
    captchaError.textContent = 'Please select each chihuahua image and only the chihuahua images.';
    return false;
  }

  for (const image of correctImages) {
    if (!selectedSet.has(image)) {
      captchaError.textContent = 'Please select every chihuahua image before continuing.';
      return false;
    }
  }

  captchaError.textContent = '';
  return true;
}

function performPendingAction() {
  if (!pendingAction) return;
  const { actionType, ruleId } = pendingAction;
  hideCaptcha();

  if (actionType === 'disable') {
    toggleRuleConfirmed(ruleId);
  } else if (actionType === 'delete') {
    deleteRuleConfirmed(ruleId);
  }
}

captchaGrid.addEventListener('click', (event) => {
  const tile = event.target.closest('.captcha-tile');
  if (!tile) return;
  tile.classList.toggle('selected');
});

captchaCancel.addEventListener('click', hideCaptcha);

captchaConfirm.addEventListener('click', () => {
  if (validateCaptcha()) {
    performPendingAction();
  }
});

captchaOverlay.addEventListener('click', (event) => {
  if (event.target === captchaOverlay) {
    hideCaptcha();
  }
});

function updateBlockType() {
  timeOptionsDiv.style.display = 'none';
  visitOptionsDiv.style.display = 'none';
  durationOptionsDiv.style.display = 'none';

  if (blockTypeSelect.value === 'time') {
    timeOptionsDiv.style.display = 'grid';
  } else if (blockTypeSelect.value === 'daily') {
    visitOptionsDiv.style.display = 'block';
  } else if (blockTypeSelect.value === 'duration') {
    durationOptionsDiv.style.display = 'block';
  }
}

blockTypeSelect.addEventListener('change', updateBlockType);

addBtn.addEventListener('click', async () => {
  if (!patternInput.value.trim()) {
    alert('Enter a website pattern');
    return;
  }

  const rule = {
    id: Date.now(),
    pattern: patternInput.value.trim(),
    blockType: blockTypeSelect.value,
    enabled: true,
  };

  if (rule.blockType === 'time') {
    rule.startTime = startTimeInput.value;
    rule.endTime = endTimeInput.value;
  } else if (rule.blockType === 'daily') {
    rule.dailyLimit = parseInt(dailyLimitInput.value, 10);
  } else if (rule.blockType === 'duration') {
    const hours = parseInt(hoursInput.value, 10) || 0;
    const minutes = parseInt(minutesInput.value, 10) || 0;
    rule.dailyTimeLimit = hours * 60 + minutes;
  }

  const data = await chrome.storage.local.get('rules');
  const rules = data.rules || [];
  rules.push(rule);
  await chrome.storage.local.set({ rules });

  patternInput.value = '';
  dailyLimitInput.value = '3';
  hoursInput.value = '1';
  minutesInput.value = '0';
  blockTypeSelect.value = 'time';
  updateBlockType();

  renderRules();
});

async function renderRules() {
  const data = await chrome.storage.local.get('rules');
  const rules = data.rules || [];

  // Get time spent for all duration rules
  const timeSpentPromises = rules
    .filter(rule => rule.blockType === 'duration')
    .map(async (rule) => {
      const timeData = await chrome.storage.local.get(`timeSpent_${rule.id}`);
      const today = new Date().toDateString();
      const timeSpent = timeData[`timeSpent_${rule.id}`] || { date: today, minutes: 0 };
      return { ruleId: rule.id, minutes: timeSpent.minutes };
    });

  const timeSpentResults = await Promise.all(timeSpentPromises);
  const timeSpentMap = {};
  timeSpentResults.forEach(result => {
    timeSpentMap[result.ruleId] = result.minutes;
  });

  rulesList.innerHTML = rules
    .map(
      (rule) => `
    <div class="rule-item">
      <div>
        <div class="rule-pattern">${rule.pattern}</div>
        <div class="rule-detail">
          ${
            rule.blockType === 'time'
              ? `${rule.startTime} — ${rule.endTime}`
              : rule.blockType === 'daily'
              ? `Daily visit limit: ${rule.dailyLimit}`
              : `Daily time limit: ${Math.floor(rule.dailyTimeLimit / 60)}h ${rule.dailyTimeLimit % 60}m (spent: ${Math.floor(timeSpentMap[rule.id] || 0)}h ${(timeSpentMap[rule.id] || 0) % 60}m)`
          }
          ${rule.enabled ? '' : ' · Disabled'}
        </div>
      </div>
      <div class="rule-actions">
        <button class="btn-small" data-toggle-rule="${rule.id}">
          ${rule.enabled ? 'Disable' : 'Enable'}
        </button>
        <button class="btn-small btn-delete" data-delete-rule="${rule.id}">Delete</button>
      </div>
    </div>
  `
    )
    .join('');

  // Attach event listeners
  document.querySelectorAll('[data-toggle-rule]').forEach(btn => {
    btn.addEventListener('click', () => toggleRule(parseInt(btn.dataset.toggleRule)));
  });
  document.querySelectorAll('[data-delete-rule]').forEach(btn => {
    btn.addEventListener('click', () => deleteRule(parseInt(btn.dataset.deleteRule)));
  });
}

async function toggleRule(ruleId) {
  const data = await chrome.storage.local.get('rules');
  const rules = data.rules || [];
  const rule = rules.find((r) => r.id === ruleId);
  if (!rule) return;

  if (rule.enabled) {
    showCaptcha('disable', ruleId);
  } else {
    toggleRuleConfirmed(ruleId);
  }
}

async function toggleRuleConfirmed(ruleId) {
  const data = await chrome.storage.local.get('rules');
  const rules = data.rules || [];
  const rule = rules.find((r) => r.id === ruleId);
  if (rule) {
    rule.enabled = !rule.enabled;
    await chrome.storage.local.set({ rules });
    renderRules();
  }
}

function deleteRule(ruleId) {
  showCaptcha('delete', ruleId);
}

async function deleteRuleConfirmed(ruleId) {
  const data = await chrome.storage.local.get('rules');
  let rules = data.rules || [];
  rules = rules.filter((r) => r.id !== ruleId);
  await chrome.storage.local.set({ rules });
  renderRules();
}

document.addEventListener('DOMContentLoaded', () => {
  updateBlockType();
  renderRules();

  document.getElementById('refreshBtn').addEventListener('click', () => window.location.reload());
});
