# Simple Website Blocker

Browser extension to reduce context shifting by blocking access to sites at specific times or limiting daily visits.

## Development Setup

This project uses plain JavaScript.

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run tests:
   ```bash
   npm test
   ```

> There is no TypeScript compilation step required.

## Loading the Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select the project folder
4. The extension should now be loaded and ready to use

## Features

- **Time-based blocking**: Block sites during specific hours
- **Visit limits**: Limit the number of times you can visit a site per day
- **Time limits**: Limit the total time spent on a site per day
- **Enable/disable rules**: Temporarily turn rules on or off

## Usage

1. Click the extension icon to open settings
2. Add blocking rules with website patterns (e.g., `*facebook.com*`)
3. Choose the blocking type and configure limits
4. Rules are automatically enforced when you visit matching sites
