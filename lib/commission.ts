/** All amounts in agorot (integer, 1 ILS = 100 agorot) */
export function calculateCommission(itemPrice: number, commissionRatePercent: number): number {
  return Math.floor((itemPrice * commissionRatePercent) / 100)
}

export function calculateTotal(itemPrice: number, shippingAmount: number): number {
  return itemPrice + shippingAmount
}
