const mongoose = require("mongoose");

// Define Inventory Schema representing owned items
const InventorySchema = new mongoose.Schema({
  userId: { 
    type: String, 
    required: true 
  },
  itemId: { 
    type: String, 
    required: true 
  },
  quantity: { 
    type: Number, 
    default: 0, 
    min: [0, "Quantity cannot be negative"] 
  }
});

// Enforce unique compound index on userId + itemId to avoid duplicate records
InventorySchema.index({ userId: 1, itemId: 1 }, { unique: true });

// Create Mongoose Model
const Inventory = mongoose.model("Inventory", InventorySchema);

class InventoryModel {
  /**
   * Fetch all inventory items owned by a user where quantity is greater than 0.
   * @param {string} userId - The Discord user ID
   * @returns {Promise<Array<object>>} Array of inventory items
   */
  static async getUserInventory(userId) {
    if (!userId) throw new Error("userId is required");
    return Inventory.find({ userId, quantity: { $gt: 0 } });
  }

  /**
   * Retrieve the quantity of a specific item owned by a user.
   * @param {string} userId - The Discord user ID
   * @param {string} itemId - The ID of the item
   * @returns {Promise<number>} The quantity
   */
  static async getItemQuantity(userId, itemId) {
    if (!userId || !itemId) throw new Error("userId and itemId are required");
    
    const record = await Inventory.findOne({ userId, itemId });
    return record ? record.quantity : 0;
  }

  /**
   * Add an item to a user's inventory.
   * Increments quantity if it already exists.
   * @param {string} userId - The Discord user ID
   * @param {string} itemId - The ID of the item
   * @param {number} quantity - Amount to add (default: 1)
   */
  static async addItem(userId, itemId, quantity = 1) {
    if (!userId || !itemId) throw new Error("userId and itemId are required");
    if (quantity <= 0 || Number.isNaN(quantity)) throw new Error("Quantity must be a positive number");

    await Inventory.findOneAndUpdate(
      { userId, itemId },
      { $inc: { quantity: quantity } },
      { upsert: true, new: true }
    );
  }

  /**
   * Remove a specific quantity of an item from a user's inventory.
   * If the quantity reaches 0, delete the record.
   * @param {string} userId - The Discord user ID
   * @param {string} itemId - The ID of the item
   * @param {number} quantity - Amount to remove (default: 1)
   * @returns {Promise<boolean>} True if successfully removed, false if user didn't have enough
   */
  static async removeItem(userId, itemId, quantity = 1) {
    if (!userId || !itemId) throw new Error("userId and itemId are required");
    if (quantity <= 0 || Number.isNaN(quantity)) throw new Error("Quantity must be a positive number");

    const record = await Inventory.findOne({ userId, itemId });
    
    if (!record || record.quantity < quantity) {
      return false; // Not enough items to remove
    }

    if (record.quantity === quantity) {
      await Inventory.deleteOne({ userId, itemId });
    } else {
      record.quantity -= quantity;
      await record.save();
    }
    
    return true;
  }

  /**
   * Delete all inventory entries for a specific user.
   * @param {string} userId - The Discord user ID
   */
  static async clearUserInventory(userId) {
    if (!userId) throw new Error("userId is required");
    await Inventory.deleteMany({ userId });
  }
}

module.exports = InventoryModel;
