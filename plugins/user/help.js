export default {
  name: 'userhelp',
  alias: ['usercommands', 'userhelp'],
  category: 'user',
  desc: 'Show user management commands',
  use: '',
  async exec({ sock, m, args, prefix }) {
    const helpMsg = `👤 *User Management Commands*

📝 *Registration & Profile*
• \`${prefix}register <name>\` - Register with the bot
• \`${prefix}profile [@user]\` - View your profile
• \`${prefix}bio [text]\` - Set or view your bio

🎯 *Level & Experience*
• \`${prefix}level [@user]\` - View level information
• \`${prefix}leaderboard [top]\` - View top users
• \`${prefix}achievements\` - View achievements

💎 *Premium & Usage*
• \`${prefix}premium [plan]\` - View premium plans
• \`${prefix}usage\` - Check daily usage limits

📊 *Admin Commands* (Owner Only)
• \`${prefix}useradmin ban @user [reason]\` - Ban a user
• \`${prefix}useradmin unban @user\` - Unban a user
• \`${prefix}useradmin warn @user [reason]\` - Warn a user
• \`${prefix}useradmin search <query>\` - Search users
• \`${prefix}useradmin info @user\` - Get user info

💡 *Quick Start:*
1. Register with \`${prefix}register <name>\`
2. View your profile with \`${prefix}profile\`
3. Set your bio with \`${prefix}bio <text>\`
4. Check your level with \`${prefix}level\`
5. View premium plans with \`${prefix}premium\`

🎮 *Features:*
• Level up by sending messages and using commands
• Earn XP for various activities
• Unlock achievements and badges
• Upgrade to premium for more features
• Daily usage limits and tracking
• Leaderboard rankings

💎 *Premium Plans:*
• Free: 50 commands/day, basic features
• Basic: 200 commands/day, custom bio
• Premium: 500 commands/day, advanced features
• VIP: 1000 commands/day, exclusive features

📞 *Need Help?*
Contact the bot owner for support or premium upgrades.`

    await m.reply(helpMsg)
  }
}