# 🛡️ Group Moderation System

Sistem moderasi grup yang lengkap dan terstruktur untuk WhatsApp bot.

## 📋 Fitur Utama

### 🛡️ Auto-Moderation
- **Anti-Spam**: Deteksi dan tindakan otomatis terhadap spam
- **Anti-Link**: Blokir sharing link yang tidak diizinkan
- **Anti-Toxic**: Filter kata-kata kasar dan tidak pantas
- **Anti-Media**: Kontrol sharing media (gambar, video, audio, dokumen)

### 👥 Member Management
- **Kick**: Keluarkan member dari grup
- **Ban**: Ban member secara permanen
- **Unban**: Hapus ban member
- **Warn**: Berikan peringatan kepada member
- **Promote/Demote**: Naikkan/turunkan status admin

### ⚙️ Group Settings
- **Welcome/Goodbye**: Pesan otomatis saat join/leave
- **Auto-Delete**: Hapus otomatis pesan command
- **Logging**: Log semua aktivitas moderasi
- **Custom Commands**: Command kustom per grup

## 📁 Struktur File

```
plugins/moderation/
├── settings.js      # Konfigurasi grup settings
├── kick.js          # Command kick member
├── ban.js           # Command ban member
├── unban.js         # Command unban member
├── warn.js          # Command warn member
├── promote.js       # Command promote admin
├── demote.js        # Command demote admin
├── info.js          # Info grup dan member
├── help.js          # Help moderasi
└── delete.js        # Delete pesan (existing)

helper/
└── groupMiddleware.js  # Middleware moderasi grup

database/models/
└── Group.js           # Model grup dengan fitur lengkap
```

## 🚀 Cara Penggunaan

### 📋 Basic Commands

#### Member Management
```bash
# Kick member
!kick @user [reason]

# Ban member
!ban @user [reason]

# Unban member
!unban @user

# Warn member
!warn @user [reason]

# Promote to admin
!promote @user

# Demote admin
!demote @user
```

#### Group Settings
```bash
# Show current settings
!groupset

# Enable/disable features
!groupset welcome on "Welcome @user!"
!groupset antispam on 5 warn
!groupset antilink on kick youtube.com facebook.com
!groupset antitoxic on warn anjing bangsat
!groupset antimedia on kick image video
!groupset autodelete on 30000
!groupset logging on log_group_id
```

#### Information
```bash
# Group info
!ginfo

# Member info
!ginfo @user

# Help
!modhelp
```

### ⚙️ Konfigurasi Auto-Moderation

#### Anti-Spam
```bash
!groupset antispam on 5 warn
!groupset antispam on 3 kick
!groupset antispam on 2 ban
```
- **Threshold**: Jumlah pesan dalam waktu tertentu
- **Action**: warn/kick/ban

#### Anti-Link
```bash
!groupset antilink on warn
!groupset antilink on kick youtube.com facebook.com
!groupset antilink on ban instagram.com tiktok.com
```
- **Whitelist**: Domain yang diizinkan
- **Action**: warn/kick/ban

#### Anti-Toxic
```bash
!groupset antitoxic on warn
!groupset antitoxic on kick anjing bangsat kontol
!groupset antitoxic on ban memek babi asu
```
- **Words**: Kata-kata yang dilarang
- **Action**: warn/kick/ban

#### Anti-Media
```bash
!groupset antimedia on warn
!groupset antimedia on kick image video
!groupset antimedia on ban audio document
```
- **Types**: image/video/audio/document
- **Action**: warn/kick/ban

## 🗄️ Database Structure

### Group Settings
```javascript
{
  // Basic settings
  name: '',
  description: '',
  welcome: false,
  goodbye: false,
  welcomeMessage: 'Selamat datang @user di grup @group!',
  goodbyeMessage: 'Selamat tinggal @user dari grup @group!',
  
  // Anti-moderation
  antiSpam: false,
  spamThreshold: 5,
  spamTimeWindow: 10000,
  spamAction: 'warn',
  
  antiLink: false,
  whitelistLinks: ['youtube.com', 'facebook.com'],
  linkAction: 'warn',
  
  antiToxic: false,
  toxicWords: ['anjing', 'bangsat'],
  toxicAction: 'warn',
  
  antiMedia: false,
  mediaTypes: ['image', 'video'],
  mediaAction: 'warn',
  
  // Auto-delete
  autoDelete: false,
  deleteCommands: true,
  deleteCommandsDelay: 30000,
  
  // Logging
  enableLogs: false,
  logGroup: '',
  
  // Statistics
  stats: {
    messages: 0,
    commands: 0,
    kicks: 0,
    bans: 0,
    warnings: 0
  },
  
  // Member tracking
  members: [],
  bannedMembers: [],
  warnedMembers: {}
}
```

## 🔧 Middleware Integration

### Group Moderation Middleware
```javascript
// Applied to every message in groups
await groupModerationMiddleware(sock, m, async () => {
  // Continue with message processing
});
```

### Features
- ✅ Anti-spam detection
- ✅ Anti-link filtering
- ✅ Anti-toxic word filtering
- ✅ Anti-media control
- ✅ Member tracking
- ✅ Warning system
- ✅ Auto-ban after 3 warnings

## 📊 Statistics & Logging

### Group Statistics
- Total messages
- Total commands
- Total kicks
- Total bans
- Total warnings

### Member Tracking
- Join/leave dates
- Last seen
- Warning history
- Ban status

### Logging
- All moderation actions
- Sent to designated log group
- Detailed information
- Timestamp tracking

## 🛡️ Security Features

### Permission Checks
- ✅ Admin-only commands
- ✅ Bot admin requirement
- ✅ Cannot moderate self
- ✅ Cannot moderate bot
- ✅ Cannot moderate admins

### Warning System
- ⚠️ Accumulative warnings (3 = auto-ban)
- ⚠️ Warning history tracking
- ⚠️ Reason logging
- ⚠️ Auto-action on threshold

### Ban System
- 🚫 Permanent ban until unban
- 🚫 Cannot rejoin while banned
- 🚫 Ban reason tracking
- 🚫 Admin-only unban

## 🎯 Use Cases

### 1. Spam Protection
```bash
# Enable anti-spam with 5 message threshold
!groupset antispam on 5 warn

# User sends 5+ messages in 10 seconds
# → Auto warning
# → After 3 warnings → Auto kick
```

### 2. Link Control
```bash
# Allow only YouTube and Facebook links
!groupset antilink on kick youtube.com facebook.com

# User shares Instagram link
# → Message deleted
# → User kicked
```

### 3. Toxic Language Filter
```bash
# Filter toxic words
!groupset antitoxic on warn anjing bangsat

# User uses toxic word
# → Message deleted
# → Warning given
```

### 4. Media Control
```bash
# Block image and video sharing
!groupset antimedia on kick image video

# User sends image
# → Media deleted
# → User kicked
```

## 🔄 Event Handling

### Welcome/Goodbye
```javascript
// Automatic welcome message
🎉 Welcome!
@user joined the group

// Automatic goodbye message
👋 Goodbye!
@user left the group
```

### Auto-Delete Commands
```javascript
// Commands auto-deleted after 30 seconds
!help → [30 seconds later] → Message deleted
```

## 📈 Performance

### Optimizations
- ✅ Efficient spam tracking
- ✅ Minimal database queries
- ✅ Async processing
- ✅ Error handling
- ✅ Memory management

### Monitoring
- 📊 Real-time statistics
- 📊 Performance metrics
- 📊 Error logging
- 📊 Usage tracking

## 🚀 Installation & Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Database
```javascript
// Database will be auto-created
// No manual setup required
```

### 3. Start Bot
```bash
npm start
```

### 4. Configure Groups
```bash
# In each group, run:
!groupset antispam on 5 warn
!groupset antilink on kick youtube.com
!groupset antitoxic on warn
```

## 🛠️ Customization

### Custom Welcome Message
```bash
!groupset welcome on "Selamat datang @user di grup @group! Semoga betah ya!"
```

### Custom Toxic Words
```bash
!groupset antitoxic on warn kata1 kata2 kata3
```

### Custom Whitelist
```bash
!groupset antilink on kick domain1.com domain2.com
```

## 📞 Support

### Troubleshooting
1. **Bot not responding**: Check if bot is admin
2. **Commands not working**: Verify permissions
3. **Settings not saving**: Check database permissions
4. **Auto-moderation not working**: Verify group settings

### Common Issues
- ❌ Bot not admin → Cannot kick/ban
- ❌ User is admin → Cannot moderate
- ❌ Invalid settings → Check syntax
- ❌ Database error → Check permissions

## 🔮 Future Features

### Planned Enhancements
- 📊 Advanced analytics
- 🔄 Backup/restore settings
- 🎨 Custom themes
- 📱 Mobile app integration
- 🤖 AI-powered moderation
- 📈 Real-time dashboard

### Roadmap
- ✅ Basic moderation (Complete)
- ✅ Auto-moderation (Complete)
- ✅ Statistics tracking (Complete)
- 🔄 Advanced analytics (In Progress)
- 📊 Dashboard (Planned)
- 🤖 AI features (Planned)

---

**Sistem moderasi grup yang lengkap, terstruktur, dan mudah digunakan! 🛡️**