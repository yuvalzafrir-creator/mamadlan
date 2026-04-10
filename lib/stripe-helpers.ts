export function calculateSellerPayout(
  itemPrice: number,
  commissionAmount: number,
  shippingAmount: number,
  shippingType: 'seller' | 'platform' | 'pickup'
): number {
  const baseAmount = itemPrice - commissionAmount
  const sellerShipping = shippingType === 'seller' ? shippingAmount : 0
  return baseAmount + sellerShipping
}
