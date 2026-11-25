import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { startWatchSync, syncAllToCloud } from './sync_watch.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const viteBin = path.join(rootDir, 'node_modules', 'vite', 'bin', 'vite.js');

const syncHandle = startWatchSync();

const viteProcess = spawn(process.execPath, [viteBin, ...process.argv.slice(2)], {
  cwd: rootDir,
  stdio: 'inherit',
});

let shuttingDown = false;
function shutdown(signalOrCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;

  syncHandle.stop();
  if (syncHandle.cloudDirs.length > 0) {
    syncAllToCloud(syncHandle.cloudDirs);
  }

  if (typeof signalOrCode === 'string') {
    process.exit(0);
  } else {
    process.exit(signalOrCode ?? 0);
  }
}

process.on('SIGINT', () => {
  viteProcess.kill('SIGINT');
  shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  viteProcess.kill('SIGTERM');
  shutdown('SIGTERM');
});

viteProcess.on('exit', (code) => {
  shutdown(code ?? 0);
});
