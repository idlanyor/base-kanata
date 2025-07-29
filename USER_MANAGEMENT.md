# User Management System

## Overview
The bot now includes a comprehensive user management system with registration, leveling, premium plans, and usage tracking.

## Features

### 🔐 User Registration
- Users must register with a name to access most features
- Registration gives initial XP bonus
- Users can set custom bios (with premium plans)

### 🏆 Leveling System
- Users earn XP for messages and commands
- Level up unlocks new features and achievements
- Progress tracking with visual progress bars
- Level-based rewards and privileges

### 💎 Premium Plans
- **Free**: 50 commands/day, basic features
- **Basic**: 200 commands/day, custom bio, priority support
- **Premium**: 500 commands/day, advanced AI, unlimited stickers
- **VIP**: 1000 commands/day, exclusive features, voice commands

### 📊 Usage Tracking
- Daily command and message limits
- Automatic reset at midnight
- Visual progress bars for usage
- Premium upgrade prompts when limits reached

### 🏆 Achievement System
- Unlock achievements for various activities
- Bonus XP for achievements
- Progress tracking and badges
- Level-based and activity-based achievements

### 🚫 Moderation Tools
- User banning system
- Warning system (auto-ban after 3 warnings)
- User search and information tools
- Admin-only moderation commands

## Commands

### User Commands
| Command | Description | Usage |
|---------|-------------|-------|
| `register` | Register with the bot | `!register <name>` |
| `profile` | View profile | `!profile [@user]` |
| `bio` | Set/view bio | `!bio [text]` |
| `level` | View level info | `!level [@user]` |
| `leaderboard` | View top users | `!leaderboard [top]` |
| `achievements` | View achievements | `!achievements` |
| `premium` | View premium plans | `!premium [plan]` |
| `usage` | Check daily usage | `!usage` |

### Admin Commands (Owner Only)
| Command | Description | Usage |
|---------|-------------|-------|
| `useradmin ban` | Ban a user | `!useradmin ban @user [reason]` |
| `useradmin unban` | Unban a user | `!useradmin unban @user` |
| `useradmin warn` | Warn a user | `!useradmin warn @user [reason]` |
| `useradmin search` | Search users | `!useradmin search <query>` |
| `useradmin info` | Get user info | `!useradmin info @user` |

## Database Structure

### User Model
```javascript
{
  jid: "user_id@s.whatsapp.net",
  name: "User Name",
  number: "628123456789",
  registered: true,
  banned: false,
  warnings: 0,
  bio: "User bio",
  level: 1,
  experience: 150,
  premiumPlan: "FREE",
  premiumExpiry: null,
  dailyUsage: {
    commands: 5,
    messages: 25,
    lastReset: "2024-01-15"
  },
  limits: {
    dailyCommands: 50,
    dailyMessages: 100,
    stickerLimit: 10,
    downloadLimit: 5
  },
  preferences: {
    language: "id",
    theme: "default",
    notifications: true
  },
  achievements: ["first_register", "level_10"],
  joinDate: "2024-01-01T00:00:00.000Z",
  lastSeen: "2024-01-15T12:30:00.000Z"
}
```

## XP System

### XP Sources
- **Messages**: +1 XP per message
- **Commands**: +5 XP per command
- **Daily Bonus**: +50 XP (if implemented)
- **Level Up**: +10 XP × level
- **Achievements**: +50 XP per achievement

### Level Calculation
```
Level = Math.floor(Total XP / 100) + 1
Next Level XP = Level × 100
```

## Premium Plans

### Free Plan
- Daily limit: 50 commands
- Basic commands only
- Standard bio (50 chars max)
- No priority support

### Basic Plan (Rp 50,000/month)
- Daily limit: 200 commands
- Custom bio (unlimited)
- Priority support
- Basic AI features

### Premium Plan (Rp 100,000/month)
- Daily limit: 500 commands
- Advanced AI features
- Unlimited stickers
- Voice commands
- Priority support

### VIP Plan (Rp 200,000/month)
- Daily limit: 1000 commands
- All features
- Exclusive features
- Highest priority support

## Achievement System

### Available Achievements
- **First Steps**: Register with the bot
- **Rising Star**: Reach level 10
- **Experienced**: Reach level 20
- **Veteran**: Reach level 30
- **Legend**: Reach level 50
- **Premium Member**: Upgrade to any premium plan
- **Week Warrior**: Use bot for 7 consecutive days
- **Command Master**: Use 100 commands in a day
- **Social Butterfly**: Send 500 messages in a day

## Middleware Integration

The system includes middleware that automatically:
- Checks user registration status
- Tracks XP and usage
- Enforces daily limits
- Checks ban status
- Updates last seen timestamp

## Usage Examples

### Basic Registration Flow
1. User sends: `!register John Doe`
2. Bot responds with welcome message and +100 XP
3. User can now use: `!profile`, `!bio`, `!level`

### Premium Upgrade Flow
1. User sends: `!premium`
2. Bot shows available plans
3. User contacts admin for upgrade
4. Admin uses: `!useradmin info @user` to verify

### Moderation Flow
1. Admin sends: `!useradmin warn @user Spam detected`
2. Bot warns user and tracks warning count
3. After 3 warnings, user is auto-banned
4. Admin can unban with: `!useradmin unban @user`

## Configuration

### XP Configuration
```javascript
export const XP_CONFIG = {
  messageXP: 1,
  commandXP: 5,
  dailyBonus: 50,
  levelMultiplier: 100
}
```

### Premium Plans
```javascript
export const PREMIUM_PLANS = {
  FREE: { dailyLimit: 50, features: ['basic_commands'] },
  BASIC: { dailyLimit: 200, features: ['custom_bio', 'priority_support'] },
  PREMIUM: { dailyLimit: 500, features: ['advanced_ai', 'unlimited_stickers'] },
  VIP: { dailyLimit: 1000, features: ['exclusive_features', 'voice_commands'] }
}
```

## Security Features

- Ban system with reason tracking
- Warning system with auto-ban after 3 warnings
- Usage limits to prevent abuse
- Premium plan validation
- Input validation for bio and registration

## Future Enhancements

- Daily login bonuses
- Weekly/monthly challenges
- Custom themes and preferences
- Advanced analytics and reporting
- Integration with external payment systems
- Multi-language support
- Advanced achievement system with tiers

## Troubleshooting

### Common Issues
1. **User not registered**: Use `!register <name>`
2. **Daily limit reached**: Upgrade to premium or wait for reset
3. **Command not working**: Check if user is banned or has required level
4. **Premium not working**: Check if premium has expired

### Admin Commands
- Use `!useradmin search <name>` to find users
- Use `!useradmin info @user` to get detailed user info
- Use `!useradmin ban @user [reason]` for moderation

## Support

For technical support or premium upgrades, contact the bot owner.