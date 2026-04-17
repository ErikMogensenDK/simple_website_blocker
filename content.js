// Ask background to check if page should be blocked
chrome.runtime.sendMessage(
  { type: 'CHECK_BLOCK', url: window.location.href },
  (response) => {
    if (response.blocked) {
      showBlockedPage(response.reason);
    }
  }
);

function showBlockedPage(reason) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          margin: 0;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .container {
          background: white;
          border-radius: 12px;
          padding: 40px;
          max-width: 500px;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }
        h1 {
          color: #333;
          margin: 0 0 16px 0;
          font-size: 32px;
        }
        p {
          color: #666;
          margin: 8px 0;
          font-size: 16px;
          line-height: 1.6;
        }
        .reason {
          background: #f0f0f0;
          padding: 16px;
          border-radius: 8px;
          margin: 24px 0;
          color: #764ba2;
          font-weight: 600;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>⏸️ Site Blocked</h1>
        <p>This site is not available right now.</p>
        <div class="reason">${reason}</div>
        <p style="color: #999; font-size: 14px;">Configure access in Simple Site Blocker extension.</p>
      </div>
    </body>
    </html>
  `;

  document.documentElement.innerHTML = html;
  document.title = 'Site Blocked';
}
