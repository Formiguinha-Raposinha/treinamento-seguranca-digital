import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const LOCAL_DIR = path.resolve(__dirname, '..');

const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  '.tmp.drivedownload',
  '.tmp.driveupload',
]);
const IGNORED_FILES = new Set(['.keep']);

function canAccessDir(dirPath) {
  try {
    fs.accessSync(dirPath, fs.constants.R_OK);
    return fs.statSync(dirPath).isDirectory();
  } catch {
    return false;
  }
}

function normalizePath(targetPath) {
  const resolved = path.resolve(targetPath);
  return process.platform === 'win32' ? resolved.toLowerCase() : resolved;
}

export function discoverCloudDirs(localDir = LOCAL_DIR) {
  const normalizedLocal = normalizePath(localDir);
  const candidates = [];

  // 1. OneDrive do usuario atual
  const oneDriveRoots = [
    process.env.OneDrive,
    process.env.OneDriveConsumer,
    process.env.OneDriveCommercial,
    path.join(os.homedir(), 'OneDrive'),
  ].filter(Boolean);

  for (const root of oneDriveRoots) {
    if (!canAccessDir(root)) continue;
    const projectDir = path.join(root, 'Projetos', 'Projeto Extensao I');
    const parentDir = path.join(root, 'Projetos');
    if (canAccessDir(projectDir) || canAccessDir(parentDir) || root === process.env.OneDrive) {
      candidates.push(projectDir);
    }
  }

  // 2. Google Drive (quando montado e acessivel)
  const gOther = 'G:\\Outros computadores\\Meu computador\\Projeto Extensao I';
  const gMain = 'G:\\Meu Drive\\Projetos\\Projeto Extensao I';
  const gParent = 'G:\\Meu Drive\\Projetos';

  if (canAccessDir(gOther)) candidates.push(gOther);
  if (canAccessDir(gMain) || canAccessDir(gParent)) candidates.push(gMain);

  const unique = [];
  const seen = new Set([normalizedLocal]);

  for (const cand of candidates) {
    const resolved = path.resolve(cand);
    const key = normalizePath(resolved);
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(resolved);
    }
  }

  return unique;
}

export function shouldIgnore(relativePath) {
  if (!relativePath) return true;
  const parts = relativePath.split(/[\\/]/).filter(Boolean);
  if (parts.length === 0) return true;
  if (parts.some((p) => IGNORED_DIRS.has(p))) return true;
  const baseName = parts[parts.length - 1];
  return IGNORED_FILES.has(baseName);
}

function filesNeedCopy(localFile, cloudFile) {
  try {
    if (!fs.existsSync(cloudFile)) return true;
    const localStat = fs.statSync(localFile);
    const cloudStat = fs.statSync(cloudFile);
    if (!cloudStat.isFile()) return true;
    if (localStat.size !== cloudStat.size) return true;
    // Tolerancia de 1s para diferencas de precisao de timestamp entre sistemas de arquivos
    return Math.abs(localStat.mtimeMs - cloudStat.mtimeMs) > 1000;
  } catch {
    return true;
  }
}

function copyFilePreservingTime(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  const stat = fs.statSync(src);
  fs.utimesSync(dest, stat.atime, stat.mtime);
}

function mirrorDirectory(localDir, cloudDir, stats) {
  fs.mkdirSync(cloudDir, { recursive: true });

  const localEntries = fs.readdirSync(localDir, { withFileTypes: true });
  const expectedNames = new Set();

  for (const entry of localEntries) {
    if (IGNORED_DIRS.has(entry.name) || IGNORED_FILES.has(entry.name)) continue;
    expectedNames.add(entry.name);

    const srcPath = path.join(localDir, entry.name);
    const destPath = path.join(cloudDir, entry.name);

    if (entry.isDirectory()) {
      mirrorDirectory(srcPath, destPath, stats);
    } else if (entry.isFile()) {
      if (filesNeedCopy(srcPath, destPath)) {
        copyFilePreservingTime(srcPath, destPath);
        stats.copied += 1;
      }
    }
  }

  if (!fs.existsSync(cloudDir)) return;
  const cloudEntries = fs.readdirSync(cloudDir, { withFileTypes: true });
  for (const entry of cloudEntries) {
    if (IGNORED_DIRS.has(entry.name) || IGNORED_FILES.has(entry.name)) continue;
    if (!expectedNames.has(entry.name)) {
      fs.rmSync(path.join(cloudDir, entry.name), { recursive: true, force: true });
      stats.removed += 1;
    }
  }
}

function syncEntryToDir(relativePath, cloudDir) {
  const localTarget = path.join(LOCAL_DIR, relativePath);
  const cloudTarget = path.join(cloudDir, relativePath);

  if (!fs.existsSync(localTarget)) {
    if (fs.existsSync(cloudTarget)) {
      fs.rmSync(cloudTarget, { recursive: true, force: true });
      return 'removed';
    }
    return 'noop';
  }

  const stat = fs.statSync(localTarget);
  if (stat.isDirectory()) {
    const stats = { copied: 0, removed: 0 };
    mirrorDirectory(localTarget, cloudTarget, stats);
    return stats.copied > 0 || stats.removed > 0 ? 'updated' : 'noop';
  }

  if (filesNeedCopy(localTarget, cloudTarget)) {
    copyFilePreservingTime(localTarget, cloudTarget);
    return 'updated';
  }

  return 'noop';
}

export function syncAllToCloud(cloudDirs = discoverCloudDirs()) {
  const summary = [];
  for (const cloudDir of cloudDirs) {
    const stats = { copied: 0, removed: 0 };
    try {
      mirrorDirectory(LOCAL_DIR, cloudDir, stats);
      summary.push({ cloudDir, ...stats, ok: true });
    } catch (err) {
      summary.push({ cloudDir, ...stats, ok: false, error: err.message });
    }
  }
  return summary;
}

export function startWatchSync({ quiet = false } = {}) {
  const cloudDirs = discoverCloudDirs();

  if (cloudDirs.length === 0) {
    if (!quiet) {
      console.warn('[Sync] Nenhum destino de nuvem acessivel encontrado. Monitoramento desativado.');
    }
    return { cloudDirs: [], stop: () => {} };
  }

  // Sincronizacao inicial ao subir o monitor
  const initialResults = syncAllToCloud(cloudDirs);
  if (!quiet) {
    console.log('==========================================================');
    console.log('  MONITOR DE SINCRONIZACAO AUTOMATICA COM A NUVEM');
    console.log(`  Local: ${LOCAL_DIR}`);
    for (const res of initialResults) {
      if (res.ok) {
        console.log(`  Nuvem: ${res.cloudDir} (${res.copied} atualizados, ${res.removed} removidos)`);
      } else {
        console.warn(`  Falha em ${res.cloudDir}: ${res.error}`);
      }
    }
    console.log('==========================================================');
  }

  let syncTimeout = null;
  const changedPaths = new Set();

  const flushChanges = () => {
    const list = Array.from(changedPaths);
    changedPaths.clear();

    for (const rel of list) {
      for (const cloudDir of cloudDirs) {
        try {
          const outcome = syncEntryToDir(rel, cloudDir);
          if (!quiet && outcome !== 'noop') {
            const timeStr = new Date().toLocaleTimeString();
            const label = outcome === 'removed' ? 'Removido da nuvem' : 'Sincronizado na nuvem';
            console.log(`[${timeStr}] ${label}: ${rel}`);
          }
        } catch (err) {
          console.error(`[Sync] Erro ao sincronizar ${rel} -> ${cloudDir}:`, err.message);
        }
      }
    }
  };

  const watcher = fs.watch(LOCAL_DIR, { recursive: true }, (_eventType, filename) => {
    if (!filename || shouldIgnore(filename)) return;
    changedPaths.add(filename);

    if (syncTimeout) clearTimeout(syncTimeout);
    syncTimeout = setTimeout(flushChanges, 400);
  });

  if (!quiet) {
    console.log('Monitor ativo! Qualquer alteracao salva sera espelhada na nuvem.\n');
  }

  return {
    cloudDirs,
    stop: () => {
      if (syncTimeout) {
        clearTimeout(syncTimeout);
        flushChanges();
      }
      watcher.close();
    },
  };
}

const isDirectRun =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);

if (isDirectRun) {
  startWatchSync();
}
