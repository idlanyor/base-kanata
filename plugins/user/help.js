export const handler = {
    command: ['userhelp', 'usercommands', 'userhelp'],
    tags: ['user'],
    help: 'Show user management commands',
    isAdmin: false,
    isBotAdmin: false,
    isOwner: false,
    isGroup: false,
    exec: async ({ sock, m, args }) => {
        const helpMsg = `👤 *User Management Commands*

📝 *Registration & Profile*
• \`!register <name>\` - Register with the bot
• \`!profile [@user]\` - View your profile
• \`!bio [text]\` - Set or view your bio

🎯 *Level & Experience*
• \`!level [@user]\` - View level information
• \`!leaderboard [top]\` - View top users
• \`!achievements\` - View achievements

💎 *Premium & Usage*
• \`!premium [plan]\` - View premium plans
• \`!usage\` - Check daily usage limits

📊 *Admin Commands* (Owner Only)
• \`!useradmin ban @user [reason]\` - Ban a user
• \`!useradmin unban @user\` - Unban a user
• \`!useradmin warn @user [reason]\` - Warn a user
• \`!useradmin search <query>\` - Search users
• \`!useradmin info @user\` - Get user info

💡 *Quick Start:*
1. Register with \`!register <name>\`
2. View your profile with \`!profile\`
3. Set your bio with \`!bio <text>\`
4. Check your level with \`!level\`
5. View premium plans with \`!premium\`

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

export default handler