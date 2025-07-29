# 🦕 Pterodactyl Management Setup Guide

Panduan lengkap untuk mengatur fitur management & backup server dengan API Pterodactyl di WhatsApp Bot.

## 📋 Prerequisites

1. **Pterodactyl Panel** yang sudah berjalan
2. **API Keys** dari Pterodactyl Panel:
   - Application API Key (untuk operasi admin)
   - Client API Key (untuk operasi user)
3. **WhatsApp Bot** yang sudah terinstall dan berjalan

## 🔧 Installation

### 1. Install Dependencies

Jika belum terinstall, tambahkan dependencies berikut ke `package.json`:

```bash
npm install node-cron
# atau
bun add node-cron
```

### 2. Setup Environment Variables

Copy file `.env.example` dan sesuaikan konfigurasi:

```bash
cp .env.example .env
```

Edit file `.env` dan tambahkan konfigurasi Pterodactyl:

```env
# Pterodactyl Panel Configuration
PTERODACTYL_PANEL_URL=https://yourpanel.domain.com
PTERODACTYL_APP_KEY=ptla_your_application_api_key_here
PTERODACTYL_CLIENT_KEY=ptlc_your_client_api_key_here

# Optional: Backup settings
PTERODACTYL_MAX_BACKUPS=5
PTERODACTYL_BACKUP_PREFIX=auto-backup
PTERODACTYL_BACKUP_RETENTION=7

# Optional: Admin notifications
PTERODACTYL_ADMIN_CHAT=120000000000000000@g.us
```

### 3. Dapatkan API Keys

#### Application API Key (Admin):
1. Login ke Pterodactyl Panel sebagai admin
2. Masuk ke **Application API** di menu admin
3. Buat API key baru dengan permissions yang diperlukan
4. Copy key yang dimulai dengan `ptla_`

#### Client API Key (User):
1. Login ke Pterodactyl Panel
2. Masuk ke **Account API** 
3. Buat API key baru
4. Copy key yang dimulai dengan `ptlc_`

### 4. Aktifkan Scheduler (Opsional)

Tambahkan inisialisasi scheduler di file `main.js` atau file startup utama:

```javascript
import { scheduler } from './lib/pterodactyl-scheduler.js';

// Di bagian startup bot
scheduler.init();
```

## 🚀 Usage

### System Commands

```bash
# Cek status koneksi API
.ptero status

# Test koneksi API
.ptero test
```

### Server Management

```bash
# List semua server
.servers

# Status server spesifik
.server status <uuid>

# Start/Stop/Restart server
.server start <uuid>
.server stop <uuid>
.server restart <uuid>
.server kill <uuid>

# Info detail server
.server info <uuid>

# Resource usage
.server resources <uuid>

# Send command ke server
.server cmd <uuid> <command>
```

### Backup Management

```bash
# List backup server
.backups <uuid>

# Create backup
.backup create <uuid> [nama]

# Delete backup
.backup delete <uuid> <backup_id>

# Restore backup
.backup restore <uuid> <backup_id>

# Download link backup
.backup download <uuid> <backup_id>

# Statistik backup
.backup stats <uuid>

# Cleanup backup lama
.backup cleanup <uuid>
```

## 📊 Scheduled Tasks

Sistem akan otomatis menjalankan tugas-tugas berikut:

### 1. Daily Cleanup (02:00)
- Membersihkan backup lama sesuai retention policy
- Mengirim notifikasi hasil cleanup

### 2. Hourly Monitoring (setiap jam)
- Monitor resource usage server
- Alert jika ada server dengan usage tinggi
- Alert jika server offline

### 3. Weekly Backup (Minggu 03:00)
- Backup otomatis semua server
- Laporan hasil backup

## ⚙️ Configuration Options

### Backup Settings

```env
# Maksimal jumlah backup per server
PTERODACTYL_MAX_BACKUPS=5

# Prefix nama backup otomatis
PTERODACTYL_BACKUP_PREFIX=auto-backup

# Retention backup dalam hari
PTERODACTYL_BACKUP_RETENTION=7
```

### API Settings

```env
# Timeout request dalam ms
PTERODACTYL_TIMEOUT=30000

# Rate limit per menit
PTERODACTYL_RATE_LIMIT=60
```

### Notifications

```env
# Group chat untuk notifikasi admin
PTERODACTYL_ADMIN_CHAT=120000000000000000@g.us
```

## 🔒 Security & Permissions

### Bot Permissions
- Hanya admin/owner yang bisa menggunakan command management
- Validasi UUID server untuk mencegah akses unauthorized

### API Permissions
- **Application API**: Butuh permission minimal read servers
- **Client API**: Butuh permission untuk server yang akan dimanage

### Best Practices
1. Gunakan API key dengan permission minimal yang diperlukan
2. Jangan share API key di public
3. Rotasi API key secara berkala
4. Monitor log untuk aktivitas mencurigakan

## 🛠️ Troubleshooting

### Common Issues

#### 1. API Connection Failed
```
❌ Failed to connect to Pterodactyl Panel
```
**Solusi:**
- Cek PTERODACTYL_PANEL_URL sudah benar
- Pastikan panel accessible dari server bot
- Cek firewall dan port

#### 2. Invalid API Key
```
❌ Invalid API key or unauthorized access
```
**Solusi:**
- Cek format API key (ptla_ atau ptlc_)
- Pastikan API key masih aktif
- Cek permissions API key

#### 3. Rate Limit Exceeded
```
❌ Rate limit exceeded
```
**Solusi:**
- Tunggu sebelum request lagi
- Naikkan PTERODACTYL_RATE_LIMIT jika perlu
- Cek apakah ada request berulang

#### 4. Server Not Found
```
❌ Resource not found
```
**Solusi:**
- Cek UUID server sudah benar
- Pastikan server masih exist
- Cek permission access ke server

### Debug Mode

Untuk debugging, set log level ke debug di logger:

```javascript
import { logger } from './helper/logger.js';
logger.level = 'debug';
```

## 📈 Monitoring & Alerts

### Resource Alerts
- **Memory > 90%**: High memory usage alert
- **Disk > 85%**: High disk usage alert  
- **CPU > 95%**: High CPU usage alert

### Server Status Alerts
- Server offline/stopped
- Server suspended
- Monitoring errors

### Backup Alerts
- Backup creation failed
- Cleanup results
- Weekly backup reports

## 🔄 Advanced Features

### Custom Backup Schedule

Untuk menambah jadwal backup custom:

```javascript
import { scheduler } from './lib/pterodactyl-scheduler.js';

// Daily backup di jam 4 pagi
scheduler.scheduleJob('daily-backup', '0 4 * * *', async () => {
    // Custom backup logic
});
```

### Server Groups Management

Buat grup server untuk management batch:

```javascript
const serverGroups = {
    'production': ['uuid1', 'uuid2', 'uuid3'],
    'staging': ['uuid4', 'uuid5'],
    'development': ['uuid6']
};

// Backup semua server production
await backupManager.createMultipleBackups(serverGroups.production);
```

### Custom Monitoring Rules

Tambah aturan monitoring custom:

```javascript
// Monitor custom metrics
const customRules = {
    memory: 80,    // Alert at 80% memory
    disk: 75,      // Alert at 75% disk  
    cpu: 85        // Alert at 85% CPU
};
```

## 📚 API Reference

### Server Manager Methods
- `getAllServers(options)` - Get all servers with pagination
- `getUserServers()` - Get user's servers
- `getServerDetails(serverId, isAdmin)` - Get server details
- `getServerResources(serverId)` - Get resource usage
- `startServer(serverId)` - Start server
- `stopServer(serverId)` - Stop server
- `restartServer(serverId)` - Restart server
- `killServer(serverId)` - Force kill server
- `sendCommand(serverId, command)` - Send console command

### Backup Manager Methods
- `createBackup(serverId, options)` - Create new backup
- `getServerBackups(serverId)` - Get server backups
- `getBackupDetails(serverId, backupId)` - Get backup details
- `deleteBackup(serverId, backupId)` - Delete backup
- `restoreBackup(serverId, backupId)` - Restore from backup
- `getBackupDownloadUrl(serverId, backupId)` - Get download URL
- `cleanupOldBackups(serverId)` - Cleanup old backups
- `getBackupStats(serverId)` - Get backup statistics

### Client Methods
- `makeAppRequest(method, endpoint, data)` - Application API request
- `makeClientRequest(method, endpoint, data)` - Client API request
- `testConnection()` - Test API connectivity
- `getAPIStatus()` - Get API status

## 📞 Support

Jika mengalami masalah:

1. Cek log error di console
2. Pastikan konfigurasi sudah benar
3. Test koneksi API dengan `.ptero test`
4. Cek dokumentasi Pterodactyl API

## 🎯 Roadmap

Fitur yang akan ditambahkan:
- [ ] Web dashboard untuk monitoring
- [ ] Database integration untuk logs
- [ ] Multi-panel support
- [ ] Advanced analytics
- [ ] Custom alerting rules
- [ ] Backup encryption
- [ ] Server templates management

---

**Happy server managing! 🚀** 