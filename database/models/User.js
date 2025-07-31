import Database from '../../helper/database.js'
import { randomBytes } from 'crypto'

// Premium plan configurations
export const PREMIUM_PLANS = {
  FREE: {
    name: 'Free',
    level: 0,
    dailyLimit: 50,
    features: ['basic_commands', 'basic_ai'],
    price: 0
  },
  BASIC: {
    name: 'Basic',
    level: 1,
    dailyLimit: 200,
    features: ['basic_commands', 'basic_ai', 'priority_support', 'custom_bio'],
    price: 50000
  },
  PREMIUM: {
    name: 'Premium',
    level: 2,
    dailyLimit: 500,
    features: ['all_commands', 'advanced_ai', 'priority_support', 'custom_bio', 'unlimited_stickers', 'voice_commands'],
    price: 100000
  },
  VIP: {
    name: 'VIP',
    level: 3,
    dailyLimit: 1000,
    features: ['all_commands', 'advanced_ai', 'priority_support', 'custom_bio', 'unlimited_stickers', 'voice_commands', 'exclusive_features'],
    price: 200000
  }
}

// Experience points configuration
export const XP_CONFIG = {
  messageXP: 1,
  commandXP: 5,
  dailyBonus: 50,
  levelMultiplier: 100
}

class User {
  static async create(userData) {
    const db = await Database.connect()
    
    const userId = userData.jid || userData.userId
    const defaultUser = {
      jid: userId,
      name: userData.name || '',
      number: userId.split('@')[0],
      registered: false,
      banned: false,
      warnings: 0,
      lastChat: Date.now(),
      // New user features
      bio: '',
      level: 1,
      experience: 0,
      premiumPlan: 'FREE',
      premiumExpiry: null,
      dailyUsage: {
        commands: 0,
        messages: 0,
        lastReset: new Date().toISOString().split('T')[0]
      },
      limits: {
        dailyCommands: 50,
        dailyMessages: 100,
        stickerLimit: 10,
        downloadLimit: 5
      },
      preferences: {
        language: 'id',
        theme: 'default',
        notifications: true
      },
      achievements: [],
      joinDate: new Date().toISOString(),
      lastSeen: new Date().toISOString()
    }

    if (!db.data.users[userId]) {
      db.data.users[userId] = defaultUser
      await db.write()
    }

    return db.data.users[userId]
  }

  static async getById(jid) {
    const db = await Database.connect()
    
    if (!db.data.users[jid]) {
      return await this.create({ jid })
    }
    
    return db.data.users[jid]
  }

  static async update(jid, data) {
    const db = await Database.connect()
    
    if (!db.data.users[jid]) {
      await this.create({ jid })
    }
    
    db.data.users[jid] = {
      ...db.data.users[jid],
      ...data,
      lastSeen: new Date().toISOString()
    }
    
    await db.write()
    return db.data.users[jid]
  }

  // Registration methods
  static async register(jid, userData) {
    const user = await this.getById(jid)
    
    if (user.registered) {
      throw new Error('User already registered')
    }
    
    const updatedUser = await this.update(jid, {
      registered: true,
      name: userData.name || user.name,
      bio: userData.bio || '',
      joinDate: new Date().toISOString()
    })
    
    // Give initial XP for registration
    await this.addExperience(jid, 100)
    
    return updatedUser
  }

  static async isRegistered(jid) {
    const user = await this.getById(jid)
    return user.registered
  }

  // Bio management
  static async setBio(jid, bio) {
    const user = await this.getById(jid)
    
    if (!user.registered) {
      throw new Error('User must be registered to set bio')
    }
    
    // Check if user has premium plan for custom bio
    const plan = PREMIUM_PLANS[user.premiumPlan]
    if (plan.level < 1 && bio.length > 50) {
      throw new Error('Custom bio requires Basic plan or higher')
    }
    
    return await this.update(jid, { bio })
  }

  static async getBio(jid) {
    const user = await this.getById(jid)
    return user.bio || 'No bio set'
  }

  // Leveling system
  static async addExperience(jid, xp) {
    const user = await this.getById(jid)
    const newXP = user.experience + xp
    const newLevel = Math.floor(newXP / XP_CONFIG.levelMultiplier) + 1
    
    const updatedUser = await this.update(jid, {
      experience: newXP,
      level: newLevel
    })
    
    // Check for level up
    if (newLevel > user.level) {
      await this.handleLevelUp(jid, newLevel)
    }
    
    return updatedUser
  }

  static async handleLevelUp(jid, newLevel) {
    // Add level up bonus
    const bonusXP = newLevel * 10
    await this.addExperience(jid, bonusXP)
    
    // Add achievement if applicable
    if (newLevel % 10 === 0) {
      await this.addAchievement(jid, `level_${newLevel}`)
    }
  }

  static async getLevelInfo(jid) {
    const user = await this.getById(jid)
    const currentLevelXP = (user.level - 1) * XP_CONFIG.levelMultiplier
    const nextLevelXP = user.level * XP_CONFIG.levelMultiplier
    const progress = ((user.experience - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100
    
    return {
      level: user.level,
      experience: user.experience,
      currentLevelXP,
      nextLevelXP,
      progress: Math.min(progress, 100),
      xpNeeded: nextLevelXP - user.experience
    }
  }

  // Premium plan management
  static async upgradePlan(jid, planName) {
    const user = await this.getById(jid)
    const plan = PREMIUM_PLANS[planName]
    
    if (!plan) {
      throw new Error('Invalid plan name')
    }
    
    if (plan.level <= PREMIUM_PLANS[user.premiumPlan].level) {
      throw new Error('Can only upgrade to higher plan')
    }
    
    const expiryDate = new Date()
    expiryDate.setMonth(expiryDate.getMonth() + 1) // 1 month subscription
    
    return await this.update(jid, {
      premiumPlan: planName,
      premiumExpiry: expiryDate.toISOString(),
      'limits.dailyCommands': plan.dailyLimit,
      'limits.dailyMessages': plan.dailyLimit * 2
    })
  }

  static async checkPremiumStatus(jid) {
    const user = await this.getById(jid)
    
    if (user.premiumExpiry) {
      const expiryDate = new Date(user.premiumExpiry)
      const now = new Date()
      
      if (now > expiryDate) {
        // Premium expired, downgrade to free
        await this.update(jid, {
          premiumPlan: 'FREE',
          premiumExpiry: null,
          'limits.dailyCommands': PREMIUM_PLANS.FREE.dailyLimit,
          'limits.dailyMessages': PREMIUM_PLANS.FREE.dailyLimit * 2
        })
        return false
      }
    }
    
    return user.premiumPlan !== 'FREE'
  }

  static async getPlanFeatures(jid) {
    const user = await this.getById(jid)
    const plan = PREMIUM_PLANS[user.premiumPlan]
    return plan.features
  }

  // Usage tracking and limits
  static async incrementUsage(jid, type) {
    const user = await this.getById(jid)
    const today = new Date().toISOString().split('T')[0]
    
    // Reset daily usage if it's a new day
    if (user.dailyUsage.lastReset !== today) {
      user.dailyUsage = {
        commands: 0,
        messages: 0,
        lastReset: today
      }
    }
    
    // Check limits
    const plan = PREMIUM_PLANS[user.premiumPlan]
    const limit = type === 'command' ? plan.dailyLimit : plan.dailyLimit * 2
    
    if (user.dailyUsage[type + 's'] >= limit) {
      throw new Error(`Daily ${type} limit reached. Upgrade to premium for more.`)
    }
    
    user.dailyUsage[type + 's']++
    
    return await this.update(jid, {
      dailyUsage: user.dailyUsage
    })
  }

  static async checkLimit(jid, type) {
    const user = await this.getById(jid)
    const plan = PREMIUM_PLANS[user.premiumPlan]
    const limit = type === 'command' ? plan.dailyLimit : plan.dailyLimit * 2
    
    return {
      used: user.dailyUsage[type + 's'] || 0,
      limit,
      remaining: limit - (user.dailyUsage[type + 's'] || 0)
    }
  }

  // Achievement system
  static async addAchievement(jid, achievementId) {
    const user = await this.getById(jid)
    
    if (!user.achievements.includes(achievementId)) {
      const updatedAchievements = [...user.achievements, achievementId]
      await this.update(jid, { achievements: updatedAchievements })
      
      // Give bonus XP for achievement
      await this.addExperience(jid, 50)
      
      return true
    }
    
    return false
  }

  static async getAchievements(jid) {
    const user = await this.getById(jid)
    return user.achievements
  }

  // User statistics
  static async getStats(jid) {
    const user = await this.getById(jid)
    const levelInfo = await this.getLevelInfo(jid)
    const premiumStatus = await this.checkPremiumStatus(jid)
    const plan = PREMIUM_PLANS[user.premiumPlan]
    
    return {
      user: {
        name: user.name,
        number: user.number,
        registered: user.registered,
        joinDate: user.joinDate,
        lastSeen: user.lastSeen
      },
      level: levelInfo,
      premium: {
        plan: user.premiumPlan,
        planName: plan.name,
        isActive: premiumStatus,
        expiry: user.premiumExpiry,
        features: plan.features
      },
      usage: {
        today: user.dailyUsage,
        limits: user.limits
      },
      achievements: user.achievements.length,
      warnings: user.warnings,
      banned: user.banned
    }
  }

  // Admin methods
  static async banUser(jid, reason = '') {
    return await this.update(jid, {
      banned: true,
      banReason: reason,
      banDate: new Date().toISOString()
    })
  }

  static async unbanUser(jid) {
    return await this.update(jid, {
      banned: false,
      banReason: null,
      banDate: null
    })
  }

  static async addWarning(jid, reason = '') {
    const user = await this.getById(jid)
    const newWarnings = user.warnings + 1
    
    const updatedUser = await this.update(jid, {
      warnings: newWarnings
    })
    
    // Auto-ban after 3 warnings
    if (newWarnings >= 3) {
      await this.banUser(jid, 'Auto-ban: 3 warnings reached')
    }
    
    return updatedUser
  }

  // Search and list methods
  static async searchUsers(query) {
    const db = await Database.connect()
    const users = Object.values(db.data.users)
    
    return users.filter(user => 
      user.name.toLowerCase().includes(query.toLowerCase()) ||
      user.number.includes(query) ||
      user.jid.includes(query)
    )
  }

  static async getTopUsers(limit = 10) {
    const db = await Database.connect()
    const users = Object.values(db.data.users)
    
    return users
      .filter(user => user.registered)
      .sort((a, b) => b.experience - a.experience)
      .slice(0, limit)
      .map((user, index) => ({
        rank: index + 1,
        name: user.name,
        level: user.level,
        experience: user.experience,
        premiumPlan: user.premiumPlan
      }))
  }

  static async getRegisteredUsers() {
    const db = await Database.connect()
    const users = Object.values(db.data.users)
    
    return users.filter(user => user.registered)
  }
}

export default User