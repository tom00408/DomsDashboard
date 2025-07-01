import 'dotenv/config';
import Client from 'ssh2-sftp-client';
import path from 'path';
import { fileURLToPath } from 'url';


// Hilfsvariablen für __dirname (weil es in ESM nicht direkt existiert)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sftp = new Client();

const config = {
  host: process.env.SFTP_SERVER,
  port: 22,
  username: process.env.SFTP_USERNAME,
  password: process.env.SFTP_KEY, // oder privateKey nutzen
};

const localDir = path.join(__dirname, 'dist');
const remoteDir = './website/'; // oder dein Zielverzeichnis

async function uploadDir(local, remote) {
    try {
      await sftp.connect(config);
      console.log('✅ Verbunden mit SFTP');
  
      try {
        await sftp.rmdir(remote, true); // Remote-Verzeichnis leeren
      } catch (err) {
        console.log('ℹ️ Kein altes Remote-Verzeichnis zum Löschen.');
      }
      console.log("Verzeichnis gelöscht");
  
      await sftp.mkdir(remote, true);
      console.log("Wir sind drin :)");
      await sftp.uploadDir(local, remote);
      console.log('🚀 Upload abgeschlossen!');
    } catch (err) {
      console.error('❌ Fehler beim Upload:', err.message);
    } finally {
      sftp.end();
    }
  }
  
  uploadDir(localDir, remoteDir);