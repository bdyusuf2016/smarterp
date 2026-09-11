/**
 * SmartERP Enterprise — Unified Development Server Runner
 * Concurrently boots both Vite Frontend (:5173) and Express API Backend (:5000)
 */

import { spawn } from 'child_process';
import process from 'process';

console.log('\x1b[36m%s\x1b[0m', '═══════════════════════════════════════════════════════════════');
console.log('\x1b[32m%s\x1b[0m', '  🚀 Starting SmartERP Full-Stack Engine (Vite + PostgreSQL API)');
console.log('\x1b[36m%s\x1b[0m', '═══════════════════════════════════════════════════════════════');
console.log('  🌐 Frontend UI:  http://localhost:5173');
console.log('  🔌 Backend API:  http://localhost:5000/api/v1');
console.log('  🐘 PostgreSQL:   Configured via .env (DATABASE_URL)');
console.log('───────────────────────────────────────────────────────────────\n');

const isWindows = process.platform === 'win32';
const npxCmd = isWindows ? 'npx.cmd' : 'npx';

// 1. Start Backend Express API Server
const serverProcess = spawn(npxCmd, ['tsx', 'watch', 'src/server.ts'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, NODE_ENV: 'development', PORT: process.env.PORT || '5000' },
});

// 2. Start Frontend Vite Dev Server
const uiProcess = spawn(npxCmd, ['vite', '--port=5173', '--host=0.0.0.0'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env },
});

const cleanup = (code = 0) => {
  console.log('\n\x1b[33m%s\x1b[0m', '🛑 Shutting down SmartERP servers...');
  try {
    if (serverProcess && !serverProcess.killed) {
      if (isWindows) {
        spawn('taskkill', ['/pid', String(serverProcess.pid), '/f', '/t']);
      } else {
        serverProcess.kill('SIGTERM');
      }
    }
  } catch (e) {}

  try {
    if (uiProcess && !uiProcess.killed) {
      if (isWindows) {
        spawn('taskkill', ['/pid', String(uiProcess.pid), '/f', '/t']);
      } else {
        uiProcess.kill('SIGTERM');
      }
    }
  } catch (e) {}

  process.exit(code);
};

process.on('SIGINT', () => cleanup(0));
process.on('SIGTERM', () => cleanup(0));
process.on('exit', () => cleanup(0));
