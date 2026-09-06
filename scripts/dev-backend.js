const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Determine PHP executable
let phpBin = 'php';

if (process.platform === 'win32') {
  let hasPhp = false;
  try {
    execSync('where php', { stdio: 'ignore' });
    hasPhp = true;
  } catch {
    hasPhp = false;
  }

  if (!hasPhp) {
    const candidates = [
      'C:\\tools\\php\\php.exe',
      'C:\\php\\php.exe',
      'C:\\xampp\\php\\php.exe'
    ];

    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        phpBin = candidate;
        const phpDir = path.dirname(candidate);
        process.env.PATH = `${phpDir};${process.env.PATH}`;
        break;
      }
    }
  }
}

const backendDir = path.resolve(__dirname, '..', 'backend');
const artisanFile = path.join(backendDir, 'artisan');

if (!fs.existsSync(artisanFile)) {
  console.error(`[BACKEND] Error: Could not find artisan at ${artisanFile}`);
  process.exit(1);
}

console.log(`[BACKEND] Starting Laravel server using: ${phpBin}`);
const child = spawn(phpBin, ['artisan', 'serve', '--host=0.0.0.0', '--port', '8000'], {
  cwd: backendDir,
  stdio: 'inherit',
  env: process.env,
  shell: false
});

child.on('error', (err) => {
  console.error('[BACKEND] Failed to start backend process:', err);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  process.exit(code !== null ? code : (signal ? 1 : 0));
});

const cleanup = (sig) => {
  if (child && !child.killed) {
    child.kill(sig);
  }
};

process.on('SIGINT', () => cleanup('SIGINT'));
process.on('SIGTERM', () => cleanup('SIGTERM'));
