#!/usr/bin/env node
// PostToolUse hook for Write events under config/.
// If the written file is JSON or markdown under config/, validate it parses.

const fs = require('fs');
const path = require('path');

let raw = '';
process.stdin.on('data', (c) => raw += c);
process.stdin.on('end', () => {
  let payload;
  try { payload = JSON.parse(raw); } catch { return; }
  const filePath = payload?.tool_input?.file_path;
  if (!filePath) return;
  const norm = filePath.replace(/\\/g, '/');
  if (!norm.includes('/config/')) return;

  const ext = path.extname(norm).toLowerCase();
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    if (ext === '.json') {
      JSON.parse(content);
    }
    // Markdown is treated as valid if it reads and is non empty.
    if (ext === '.md' && !content.trim()) {
      console.error(`validate-config: ${filePath} is empty`);
      process.exit(2);
    }
  } catch (e) {
    console.error(`validate-config: ${filePath} failed validation, ${e.message}`);
    process.exit(2);
  }
});
