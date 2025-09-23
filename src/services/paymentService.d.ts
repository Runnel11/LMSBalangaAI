export type StartCheckoutArgs = {
  levelId: string | number;
  productId: string;
  amount?: number | null;
  currency?: string;
};

export type PaymentService = {
  startCheckout(args: StartCheckoutArgs): Promise<{ success: boolean; error?: string }>;
  refreshEntitlements(): Promise<string[]>;
  getCachedEntitlements(): Promise<string[]>;
  isLevelUnlocked(args: { levelId: string | number; orderIndex?: number }): Promise<boolean>;
};

export const paymentService: PaymentService;
export default paymentService;
