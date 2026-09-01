export class StockCalcService {
  /**
   * Calculates new weighted average cost on stock inward.
   */
  public static calculateWeightedAverageCost(
    currentQty: number,
    currentAvgCost: number,
    inwardQty: number,
    inwardUnitCost: number
  ): string {
    if (inwardQty <= 0) return currentAvgCost.toFixed(2);
    if (currentQty <= 0) return inwardUnitCost.toFixed(2);

    const totalOldCost = currentQty * currentAvgCost;
    const totalNewCost = inwardQty * inwardUnitCost;
    const newTotalQty = currentQty + inwardQty;

    const newAvgCost = (totalOldCost + totalNewCost) / newTotalQty;
    return newAvgCost.toFixed(2);
  }

  /**
   * Checks if stock level breaches reorder threshold.
   */
  public static isLowStock(currentQty: number, reorderLevel: number, alertQty: number): boolean {
    const threshold = Math.max(reorderLevel, alertQty);
    return currentQty <= threshold;
  }

  /**
   * Formats quantity with 3-decimal precision (e.g. 5.250).
   */
  public static formatQuantity(qty: number): string {
    return Number(qty).toFixed(3);
  }
}
