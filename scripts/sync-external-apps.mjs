import { promises as fs } from 'fs';
import { spawnSync } from 'child_process';
import path from 'path';

const rootDir = process.cwd();
const publicDir = path.join(rootDir, 'public');
const darkestSourceDir = path.join(rootDir, 'darkest_clone', 'dist');
const darkestTargetDir = path.join(publicDir, 'darkest_clone');
const standaloneSourceDir = path.join(rootDir, 'standalone_cc', 'dist');
const standaloneTargetDir = path.join(publicDir, 'standalone_cc');

const textExtensions = new Set([
  '.html',
  '.js',
  '.jsx',
  '.css',
  '.json',
  '.md',
  '.txt',
  '.mjs',
  '.cjs',
  '.ts',
  '.tsx'
]);

async function copyTree(sourceDir, targetDir, transformText = false) {
  await fs.rm(targetDir, { recursive: true, force: true });
  await fs.mkdir(targetDir, { recursive: true });

  const copyEntry = async (sourcePath, targetPath) => {
    const stats = await fs.stat(sourcePath);
    if (stats.isDirectory()) {
      await fs.mkdir(targetPath, { recursive: true });
      const entries = await fs.readdir(sourcePath, { withFileTypes: true });
      for (const entry of entries) {
        await copyEntry(path.join(sourcePath, entry.name), path.join(targetPath, entry.name));
      }
      return;
    }

    const ext = path.extname(sourcePath).toLowerCase();
    const destinationPath = transformText && ext === '.jsx'
      ? targetPath.slice(0, -4) + '.js'
      : targetPath;

    await fs.mkdir(path.dirname(destinationPath), { recursive: true });

    if (transformText && textExtensions.has(ext)) {
      const raw = await fs.readFile(sourcePath, 'utf8');
      const transformed = ext === '.html'
        ? raw.replaceAll('main.jsx', 'main.js').replaceAll('.jsx', '.js')
        : raw.replaceAll('.jsx', '.js');
      await fs.writeFile(destinationPath, transformed, 'utf8');
      return;
    }

    await fs.copyFile(sourcePath, destinationPath);
  };

  await copyEntry(sourceDir, targetDir);
}

const darkestBuild = spawnSync('npm', ['run', 'build:darkest_clone'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: true
});

if (darkestBuild.status !== 0) {
  throw new Error('darkest_clone build failed');
}

await copyTree(darkestSourceDir, darkestTargetDir, false);

const standaloneBuild = spawnSync('npm', ['run', 'build'], {
  cwd: path.join(rootDir, 'standalone_cc'),
  stdio: 'inherit',
  shell: true
});

if (standaloneBuild.status !== 0) {
  throw new Error('standalone_cc build failed');
}

await copyTree(standaloneSourceDir, standaloneTargetDir, false);
