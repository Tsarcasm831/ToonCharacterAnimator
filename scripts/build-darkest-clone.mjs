import { spawnSync } from 'child_process';

const build = spawnSync('npm', ['exec', '--', 'vite', 'build', '--config', 'darkest_clone/vite.config.js'], {
  cwd: process.cwd(),
  stdio: 'inherit',
  shell: true,
});

if (build.status !== 0) {
  throw new Error('darkest_clone build failed');
}
