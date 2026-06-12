const mongoose = require("mongoose");

// Define User Schema
const UserSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  wallet: { type: Number, default: 0, min: [0, "Wallet cannot be negative"] },
  bank: { type: Number, default: 0, min: [0, "Bank cannot be negative"] },
  prestige: { type: Number, default: 0 },
  totalEarned: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  // lastDaily/lastWork kept for backward compat
  lastDaily: { type: Number, default: 0 },
  lastWork: { type: Number, default: 0 },
  // Generic cooldown map: e.g. cooldowns.rob, cooldowns.crime, cooldowns.beg
  cooldowns: { type: Map, of: Number, default: {} }
});

const User = mongoose.model("User", UserSchema);

class UserModel {
  static async get(userId) {
    if (!userId) throw new Error("userId is required");
    let user = await User.findOne({ userId });
    if (!user) {
      user = new User({ userId });
      await user.save();
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
    await User.findOneAndUpdate({ userId }, { $set: fields }, { new: true, upsert: true, runValidators: true });
  }

  static async addCoins(userId, amount, type = "wallet") {
    if (amount <= 0 || Number.isNaN(amount)) throw new Error("Amount must be positive");
    const user = await this.get(userId);
    user[type] += amount;
    if (type === "wallet") user.totalEarned = (user.totalEarned || 0) + amount;
    await user.save();
    return user[type];
  }

  static async removeCoins(userId, amount, type = "wallet") {
    if (amount <= 0 || Number.isNaN(amount)) throw new Error("Amount must be positive");
    const user = await this.get(userId);
    if (user[type] < amount) throw new Error(`Insufficient ${type} funds`);
    user[type] -= amount;
    if (type === "wallet") user.totalSpent = (user.totalSpent || 0) + amount;
    await user.save();
    return user[type];
  }

  // Generic cooldown helpers
  static async getCooldown(userId, key) {
    const user = await this.get(userId);
    return user.cooldowns.get(key) || 0;
  }

  static async setCooldown(userId, key, timestamp) {
    const user = await this.get(userId);
    user.cooldowns.set(key, timestamp);
    await user.save();
  }

  static async resetCooldown(userId, key) {
    const user = await this.get(userId);
    user.cooldowns.set(key, 0);
    await user.save();
  }

  static async getTopUsers(limit = 10) {
    return User.aggregate([
      { $project: { userId: 1, wallet: 1, bank: 1, prestige: 1, total: { $add: ["$wallet", "$bank"] } } },
      { $sort: { total: -1 } },
      { $limit: limit }
    ]);
  }

  static async getTotalUsers() {
    return User.countDocuments();
  }

  static async getTotalCoinsInCirculation() {
    const result = await User.aggregate([
      { $group: { _id: null, totalWallet: { $sum: "$wallet" }, totalBank: { $sum: "$bank" } } }
    ]);
    return result[0] || { totalWallet: 0, totalBank: 0 };
  }

  static async getUserRank(userId) {
    const user = await this.get(userId);
    const netWorth = user.wallet + user.bank;
    const rank = await User.countDocuments({ $expr: { $gt: [{ $add: ["$wallet", "$bank"] }, netWorth] } });
    return rank + 1;
  }

  static async reset(userId) {
    await User.findOneAndUpdate(
      { userId },
      { $set: { wallet: 0, bank: 0, lastDaily: 0, lastWork: 0, cooldowns: {}, totalEarned: 0, totalSpent: 0 } },
      { new: true, upsert: true }
    );
    const Inventory = mongoose.model("Inventory");
    await Inventory.deleteMany({ userId });
  }
}

module.exports = UserModel;
