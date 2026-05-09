#!/usr/bin/env node
// Posts a brief summary of Notion writes to #ai-activity in Slack.
// Reads tool name and result from the PostToolUse hook stdin payload.
// Silently no-ops if SLACK_BOT_TOKEN is missing.

const https = require('https');

let raw = '';
process.stdin.on('data', (c) => raw += c);
process.stdin.on('end', () => {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) return;
  let payload;
  try { payload = JSON.parse(raw); } catch { return; }
  const tool = payload.tool_name || 'mcp__notion__unknown';
  const text = `Claudio updated Notion via \`${tool}\``;
  const body = JSON.stringify({ channel: '#ai-activity', text });
  const req = https.request({
    hostname: 'slack.com',
    path: '/api/chat.postMessage',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Length': Buffer.byteLength(body),
    },
  });
  req.on('error', () => {});
  req.write(body);
  req.end();
});
