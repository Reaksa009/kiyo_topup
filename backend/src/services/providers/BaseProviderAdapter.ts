export interface ProviderOrderRequest {
  orderNumber: string;
  productId: string;
  playerFields: Record<string, string>;
  quantity?: number;
}

export interface ProviderOrderResponse {
  success: boolean;
  externalOrderId?: string;
  status: 'pending' | 'processing' | 'success' | 'failed';
  costPrice?: number;
  message?: string;
  rawResponse?: any;
}

export interface ProviderBalanceResponse {
  success: boolean;
  balance: number;
  currency: string;
  rawResponse?: any;
}

export interface PlayerValidationResponse {
  valid: boolean;
  username?: string;
  message?: string;
  rawResponse?: any;
}

export abstract class BaseProviderAdapter {
  abstract readonly providerName: string;

  /**
   * Submit a top-up request to the external provider
   */
  abstract submitOrder(request: ProviderOrderRequest): Promise<ProviderOrderResponse>;

  /**
   * Query current order fulfillment status from provider
   */
  abstract checkOrderStatus(externalOrderId: string): Promise<ProviderOrderResponse>;

  /**
   * Check account balance with provider
   */
  abstract getBalance(): Promise<ProviderBalanceResponse>;

  /**
   * Validate player account credentials with provider
   */
  abstract validatePlayer(gameSlug: string, fields: Record<string, string>): Promise<PlayerValidationResponse>;
}
