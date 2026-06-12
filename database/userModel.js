const { prisma } = require("./db");

class UserModel {
  static async get(userId) {
    if (!userId) throw new Error("userId is required");
    let user = await prisma.user.findUnique({ where: { userId } });
    if (!user) {
      user = await prisma.user.create({ data: { userId, cooldowns: {} } });
    }
    return user;
  }

  static async update(userId, fields) {
    if (!userId) throw new Error("userId is required");
    const keys = Object.keys(fields);
    for (const key of keys) {
      if (key === "wallet" || key === "bank") {
        const val = fields[key];
        if (typeof val !== "number" || Number.isNaN(val)) throw new Error(`Invalid value for '${key}'`);
        if (val < 0) throw new Error(`'${key}' cannot be negative`);
      }
    }
    await prisma.user.upsert({
      where: { userId },
      update: fields,
      create: { userId, ...fields, cooldowns: {} }
    });
  }

  static async addCoins(userId, amount, type = "wallet") {
    if (amount <= 0 || Number.isNaN(amount)) throw new Error("Amount must be positive");
    const user = await this.get(userId);
    
    const updateData = { [type]: user[type] + amount };
    if (type === "wallet") {
      updateData.totalEarned = (user.totalEarned || 0) + amount;
    }

    const updatedUser = await prisma.user.update({
      where: { userId },
      data: updateData
    });
    return updatedUser[type];
  }

  static async removeCoins(userId, amount, type = "wallet") {
    if (amount <= 0 || Number.isNaN(amount)) throw new Error("Amount must be positive");
    const user = await this.get(userId);
    if (user[type] < amount) throw new Error(`Insufficient ${type} funds`);
    
    const updateData = { [type]: user[type] - amount };
    if (type === "wallet") {
      updateData.totalSpent = (user.totalSpent || 0) + amount;
    }

    const updatedUser = await prisma.user.update({
      where: { userId },
      data: updateData
    });
    return updatedUser[type];
  }

  // Generic cooldown helpers
  static async getCooldown(userId, key) {
    const user = await this.get(userId);
    const cooldowns = user.cooldowns || {};
    return cooldowns[key] || 0;
  }

  static async setCooldown(userId, key, timestamp) {
    const user = await this.get(userId);
    const cooldowns = user.cooldowns || {};
    cooldowns[key] = timestamp;
    
    await prisma.user.update({
      where: { userId },
      data: { cooldowns }
    });
  }

  static async resetCooldown(userId, key) {
    const user = await this.get(userId);
    const cooldowns = user.cooldowns || {};
    cooldowns[key] = 0;
    
    await prisma.user.update({
      where: { userId },
      data: { cooldowns }
    });
  }

  static async getTopUsers(limit = 10) {
    // In PostgreSQL, we can order by computed fields, or fetch and sort. 
    // Prisma doesn't natively support ordering by A + B easily in query builder
    // So we'll fetch all or use raw SQL. For safety in Prisma, let's use a fast fetch and sort in memory, 
    // or we can use Prisma's executeRaw if needed. Given it's a bot, fetch and sort works for small datasets.
    // For large scale, we should use a raw query:
    const users = await prisma.$queryRaw`SELECT "userId", "wallet", "bank", "prestige", ("wallet" + "bank") as "total" FROM "users" ORDER BY "total" DESC LIMIT ${limit}`;
    return users;
  }

  static async getTotalUsers() {
    return prisma.user.count();
  }

  static async getTotalCoinsInCirculation() {
    const agg = await prisma.user.aggregate({
      _sum: {
        wallet: true,
        bank: true
      }
    });
    return {
      totalWallet: agg._sum.wallet || 0,
      totalBank: agg._sum.bank || 0
    };
  }

  static async getUserRank(userId) {
    const user = await this.get(userId);
    const netWorth = user.wallet + user.bank;
    
    const count = await prisma.$queryRaw`SELECT COUNT(*) as rank FROM "users" WHERE ("wallet" + "bank") > ${netWorth}`;
    // BigInt return from count in raw query needs parsing
    return Number(count[0].rank) + 1;
  }

  static async reset(userId) {
    await prisma.user.upsert({
      where: { userId },
      update: { wallet: 0, bank: 0, lastDaily: 0, lastWork: 0, cooldowns: {}, totalEarned: 0, totalSpent: 0 },
      create: { userId, wallet: 0, bank: 0, cooldowns: {} }
    });
    
    await prisma.inventory.deleteMany({
      where: { userId }
    });
  }
}

module.exports = UserModel;
