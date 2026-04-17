const patternInput = document.getElementById('pattern');
const blockTypeSelect = document.getElementById('blockType');
const timeOptionsDiv = document.getElementById('timeOptions');
const dailyOptionsDiv = document.getElementById('dailyOptions');
const startTimeInput = document.getElementById('startTime');
const endTimeInput = document.getElementById('endTime');
const dailyLimitInput = document.getElementById('dailyLimit');
const enabledCheckbox = document.getElementById('enabled');
const addBtn = document.getElementById('addBtn');
const rulesList = document.getElementById('rulesList');

// Show/hide options based on block type
blockTypeSelect.addEventListener('change', (e) => {
  if (e.target.value === 'time') {
    timeOptionsDiv.style.display = 'grid';
    dailyOptionsDiv.style.display = 'none';
  } else {
    timeOptionsDiv.style.display = 'none';
    dailyOptionsDiv.style.display = 'block';
  }
});

// Add rule
addBtn.addEventListener('click', async () => {
  if (!patternInput.value.trim()) {
    alert('Enter a website pattern');
    return;
  }

  const rule = {
    id: Date.now(),
    pattern: patternInput.value.trim(),
    blockType: blockTypeSelect.value,
    enabled: enabledCheckbox.checked,
  };

  if (rule.blockType === 'time') {
    rule.startTime = startTimeInput.value;
    rule.endTime = endTimeInput.value;
  } else {
    rule.dailyLimit = parseInt(dailyLimitInput.value);
  }

  const data = await chrome.storage.local.get('rules');
  const rules = data.rules || [];
  rules.push(rule);
  await chrome.storage.local.set({ rules });

  patternInput.value = '';
  dailyLimitInput.value = '3';
  enabledCheckbox.checked = true;

  renderRules();
});

// Render rules
async function renderRules() {
  const data = await chrome.storage.local.get('rules');
  const rules = data.rules || [];

  rulesList.innerHTML = rules
    .map(
      (rule) => `
    <div class="rule-item">
      <div class="rule-info">
        <div class="rule-pattern">${rule.pattern}</div>
        <div class="rule-detail">
          ${rule.blockType === 'time' ? `${rule.startTime} - ${rule.endTime}` : `Daily limit: ${rule.dailyLimit}`}
          ${rule.enabled ? '' : ' (disabled)'}
        </div>
      </div>
      <div class="rule-actions">
        <button class="btn-small" onclick="toggleRule(${rule.id})">
          ${rule.enabled ? 'Off' : 'On'}
        </button>
        <button class="btn-small btn-delete" onclick="deleteRule(${rule.id})">Delete</button>
      </div>
    </div>
  `
    )
    .join('');
}

// Toggle rule enabled/disabled
window.toggleRule = async (ruleId) => {
  const data = await chrome.storage.local.get('rules');
  const rules = data.rules || [];
  const rule = rules.find((r) => r.id === ruleId);
  if (rule) {
    rule.enabled = !rule.enabled;
    await chrome.storage.local.set({ rules });
    renderRules();
  }
};

// Delete rule
window.deleteRule = async (ruleId) => {
  const data = await chrome.storage.local.get('rules');
  let rules = data.rules || [];
  rules = rules.filter((r) => r.id !== ruleId);
  await chrome.storage.local.set({ rules });
  renderRules();
};

// Load rules on popup open
renderRules();
