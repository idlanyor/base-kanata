// Handler decorator untuk memudahkan pendefinisian command
export function defineHandler(options = {}) {
  return {
    command: options.command || [], // string/regex/array
    tags: options.tags || [], // kategori command
    help: options.help || '', // deskripsi command
    isAdmin: options.isAdmin || false,
    isBotAdmin: options.isBotAdmin || false, 
    isPremium: options.isPremium || false,
    isOwner: options.isOwner || false,
    isGroup: options.isGroup || false,
    cooldown: options.cooldown || 0,
    exec: options.exec || (async () => {})
  }
} 