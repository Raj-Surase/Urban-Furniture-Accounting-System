const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function getPhpExecutable() {
  if (process.env.PHP_PATH && fs.existsSync(process.env.PHP_PATH)) {
    return process.env.PHP_PATH;
  }

  if (process.platform === 'win32') {
    const standardPaths = [
      'C:\\tools\\php\\php.exe',
      'C:\\php\\php.exe',
      'C:\\xampp\\php\\php.exe'
    ];

    for (const candidate of standardPaths) {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }

    try {
      const output = execSync('where php.exe', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
      const firstLine = output.split(/\r?\n/)[0];
      if (firstLine && fs.existsSync(firstLine)) {
        return firstLine;
      }
    } catch {
      // ignore
    }
  }

  return 'php';
}

const phpBin = getPhpExecutable();
const phpDir = path.dirname(phpBin);
if (fs.existsSync(phpDir) && !process.env.PATH.includes(phpDir)) {
  process.env.PATH = `${phpDir};${process.env.PATH}`;
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
