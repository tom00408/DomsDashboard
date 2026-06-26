// npm install ssh2-sftp-client --save-dev
// Vor dem ersten Deploy: npm run build
// Deploy: npm run deploy
// Benötigte .env-Variablen: SFTP_HOST, SFTP_USERNAME, SFTP_KEY

import 'dotenv/config';
import { existsSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import Client from 'ssh2-sftp-client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localDir = path.join(__dirname, 'dist');
// Wohin auf dem Server? Subdomain dashboard.mtvgeismar.de zeigt auf dashboard/website/
// In .env: REMOTE_DIR=./dashboard/website/
const remoteDir = process.env.REMOTE_DIR || './dashboard/website/';

const config = {
  host: process.env.SFTP_HOST,
  port: 22,
  username: process.env.SFTP_USERNAME,
  password: process.env.SFTP_KEY,
};

function checkEnv() {
  const missing = [];
  if (!config.host) missing.push('SFTP_HOST');
  if (!config.username) missing.push('SFTP_USERNAME');
  if (!config.password) missing.push('SFTP_KEY');
  if (missing.length) {
    console.error('❌ Fehlende Umgebungsvariablen in .env:', missing.join(', '));
    process.exit(1);
  }
}

async function runBuild() {
  console.log('📦 Build wird ausgeführt (vite build)…');
  try {
    execSync('npm run build', { stdio: 'inherit', cwd: __dirname });
  } catch (err) {
    console.error('❌ Build fehlgeschlagen.');
    process.exit(1);
  }
}

async function upload() {
  const sftp = new Client();
  try {
    await sftp.connect(config);
    console.log('✅ Verbunden mit SFTP');

    try {
      await sftp.rmdir(remoteDir, true);
      console.log('ℹ️ Altes Remote-Verzeichnis gelöscht.');
    } catch (err) {
      console.log('ℹ️ Kein altes Remote-Verzeichnis zum Löschen.');
    }

    await sftp.mkdir(remoteDir, true);
    await sftp.uploadDir(localDir, remoteDir);
    console.log('🚀 Upload abgeschlossen!');
    console.log('   Ziel auf dem Server:', remoteDir);
    console.log('   Tipp: Hard-Refresh im Browser (Strg+Shift+R), falls die Seite sich nicht aktualisiert.');
  } catch (err) {
    console.error('❌ Fehler beim Upload:', err.message);
    process.exit(1);
  } finally {
    sftp.end();
  }
}

(async () => {
  checkEnv();

  if (!existsSync(localDir)) {
    console.log('📁 Ordner "dist" fehlt – starte Build…');
    await runBuild();
  } else {
    console.log('📁 Ordner "dist" gefunden.');
  }

  await upload();
})();
