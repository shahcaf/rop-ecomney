const { prisma } = require("./db");

class InventoryModel {
  /**
   * Fetch all inventory items owned by a user where quantity is greater than 0.
   */
  static async getUserInventory(userId) {
    if (!userId) throw new Error("userId is required");
    return prisma.inventory.findMany({
      where: {
        userId,
        quantity: { gt: 0 }
      }
    });
  }

  /**
   * Retrieve the quantity of a specific item owned by a user.
   */
  static async getItemQuantity(userId, itemId) {
    if (!userId || !itemId) throw new Error("userId and itemId are required");
    
    const record = await prisma.inventory.findUnique({
      where: {
        userId_itemId: { userId, itemId }
      }
    });
    return record ? record.quantity : 0;
  }

  /**
   * Add an item to a user's inventory.
   */
  static async addItem(userId, itemId, quantity = 1) {
    if (!userId || !itemId) throw new Error("userId and itemId are required");
    if (quantity <= 0 || Number.isNaN(quantity)) throw new Error("Quantity must be a positive number");

    await prisma.inventory.upsert({
      where: {
        userId_itemId: { userId, itemId }
      },
      update: {
        quantity: { increment: quantity }
      },
      create: {
        userId,
        itemId,
        quantity
      }
    });
  }

  /**
   * Remove a specific quantity of an item from a user's inventory.
   */
  static async removeItem(userId, itemId, quantity = 1) {
    if (!userId || !itemId) throw new Error("userId and itemId are required");
    if (quantity <= 0 || Number.isNaN(quantity)) throw new Error("Quantity must be a positive number");

    const record = await prisma.inventory.findUnique({
      where: { userId_itemId: { userId, itemId } }
    });
    
    if (!record || record.quantity < quantity) {
      return false; // Not enough items to remove
    }

    if (record.quantity === quantity) {
      await prisma.inventory.delete({
        where: { userId_itemId: { userId, itemId } }
      });
    } else {
      await prisma.inventory.update({
        where: { userId_itemId: { userId, itemId } },
        data: { quantity: { decrement: quantity } }
      });
    }
    
    return true;
  }

  /**
   * Delete all inventory entries for a specific user.
   */
  static async clearUserInventory(userId) {
    if (!userId) throw new Error("userId is required");
    await prisma.inventory.deleteMany({
      where: { userId }
    });
  }
}

module.exports = InventoryModel;
