export function calculateSimpleInterest(principal: number, annualRate: number, tenureDays: number): number {
  return (principal * annualRate * (tenureDays / 365)) / 100;
}

export function calculateTotalRepayment(principal: number, annualRate: number, tenureDays: number): number {
  return principal + calculateSimpleInterest(principal, annualRate, tenureDays);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}
