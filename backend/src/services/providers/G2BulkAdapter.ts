import axios from 'axios';
import {
  BaseProviderAdapter,
  ProviderOrderRequest,
  ProviderOrderResponse,
  ProviderBalanceResponse
} from './BaseProviderAdapter';
import { env } from '../../config/env';
import { ProviderLog } from '../../models/Provider';
import { logger } from '../../utils/logger';

export const G2BULK_GAME_CODE_MAP: Record<string, string[]> = {
  'mobile-legends': ['mlbb', 'mlbb_global', 'mlbb_special', 'mlbb_exclusive', 'mlbb_ru', 'mlbb_tr', 'mlbb_br'],
  'free-fire': ['freefire_global'],
  'pubg-mobile': ['pubg'],
  'valorant': ['valorant_ph'],
  'honor-of-kings': ['hok'],
  'cod-mobile': ['garena_undawn', 'codm'],
  'genshin-impact': ['genshin']
};

export class G2BulkAdapter extends BaseProviderAdapter {
  readonly providerName = 'G2BULK';

  private get apiUrl() {
    return env.G2BULK_API_URL.replace(/\/$/, '');
  }

  private async logExecution(
    endpoint: string,
    requestPayload: any,
    responsePayload: any,
    statusCode: number,
    startTime: number
  ) {
    try {
      if (env.NODE_ENV === 'test') return;
      const executionTimeMs = Date.now() - startTime;
      await ProviderLog.create({
        providerType: this.providerName,
        endpoint,
        requestPayload: typeof requestPayload === 'object' ? requestPayload : { raw: requestPayload },
        responsePayload: typeof responsePayload === 'object' ? responsePayload : { raw: responsePayload },
        statusCode,
        executionTimeMs
      });
    } catch (err) {
      logger.error('Failed to save ProviderLog:', err);
    }
  }

  async submitOrder(request: ProviderOrderRequest): Promise<ProviderOrderResponse> {
    const startTime = Date.now();
    const endpoint = `https://api.g2bulk.com/api/v2`;
    
    const userId = request.playerFields.userId || request.playerFields.playerId || '';
    const zoneId = request.playerFields.zoneId || request.playerFields.serverId || '';
    const link = zoneId ? `${userId}|${zoneId}` : userId;

    const params = new URLSearchParams();
    params.append('key', env.G2BULK_API_KEY);
    params.append('action', 'add');
    params.append('service', request.productId);
    params.append('link', link);
    params.append('quantity', (request.quantity || 1).toString());

    try {
      // In sandbox / mock mode fallback if external API key is sample
      if (env.G2BULK_API_KEY.includes('sample') || env.NODE_ENV === 'test') {
        const mockResponse = {
          order: `G2B-${Date.now()}`
        };
        await this.logExecution(endpoint, params.toString(), mockResponse, 200, startTime);
        return {
          success: true,
          externalOrderId: mockResponse.order,
          status: 'processing',
          costPrice: 0.95,
          message: 'Mock G2Bulk order created successfully (Sandbox)',
          rawResponse: mockResponse
        };
      }

      const res = await axios.post(endpoint, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 15000
      });
      await this.logExecution(endpoint, params.toString(), res.data, res.status, startTime);

      if (res.data?.order) {
        return {
          success: true,
          externalOrderId: res.data.order.toString(),
          status: 'processing',
          costPrice: 0,
          message: 'Order placed with G2Bulk',
          rawResponse: res.data
        };
      }

      return {
        success: false,
        status: 'failed',
        message: res.data?.error || 'Failed to place order with G2Bulk',
        rawResponse: res.data
      };
    } catch (error: any) {
      const responseData = error.response?.data || { error: error.message };
      const statusCode = error.response?.status || 500;
      await this.logExecution(endpoint, params.toString(), responseData, statusCode, startTime);

      return {
        success: false,
        status: 'failed',
        message: error.message || 'Network error executing G2Bulk request',
        rawResponse: responseData
      };
    }
  }

  async checkOrderStatus(externalOrderId: string): Promise<ProviderOrderResponse> {
    const startTime = Date.now();
    const endpoint = `https://api.g2bulk.com/api/v2`;

    const params = new URLSearchParams();
    params.append('key', env.G2BULK_API_KEY);
    params.append('action', 'status');
    params.append('order', externalOrderId);

    try {
      if (env.G2BULK_API_KEY.includes('sample') || env.NODE_ENV === 'test') {
        const mockResponse = {
          status: 'Completed'
        };
        await this.logExecution(endpoint, params.toString(), mockResponse, 200, startTime);
        return {
          success: true,
          externalOrderId,
          status: 'success',
          message: 'Top-up completed',
          rawResponse: mockResponse
        };
      }

      const res = await axios.post(endpoint, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 15000
      });
      await this.logExecution(endpoint, params.toString(), res.data, res.status, startTime);

      if (res.data?.error) {
        return {
          success: false,
          status: 'failed',
          message: res.data.error,
          rawResponse: res.data
        };
      }

      const statusMap: Record<string, 'pending' | 'processing' | 'success' | 'failed'> = {
        completed: 'success',
        success: 'success',
        processing: 'processing',
        pending: 'pending',
        failed: 'failed',
        canceled: 'failed'
      };

      const mappedStatus = statusMap[res.data?.status?.toLowerCase()] || 'processing';

      return {
        success: true,
        externalOrderId,
        status: mappedStatus,
        message: `Status: ${res.data?.status || mappedStatus}`,
        rawResponse: res.data
      };
    } catch (error: any) {
      const responseData = error.response?.data || { error: error.message };
      const statusCode = error.response?.status || 500;
      await this.logExecution(endpoint, params.toString(), responseData, statusCode, startTime);

      return {
        success: false,
        status: 'failed',
        message: error.message,
        rawResponse: responseData
      };
    }
  }

  async getBalance(): Promise<ProviderBalanceResponse> {
    const startTime = Date.now();
    const endpoint = `https://api.g2bulk.com/api/v2`;

    const params = new URLSearchParams();
    params.append('key', env.G2BULK_API_KEY);
    params.append('action', 'balance');

    try {
      if (env.G2BULK_API_KEY.includes('sample') || env.NODE_ENV === 'test') {
        return {
          success: true,
          balance: 1250.75,
          currency: 'USD',
          rawResponse: { mock: true, balance: 1250.75 }
        };
      }

      const res = await axios.post(endpoint, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 10000
      });
      await this.logExecution(endpoint, params.toString(), res.data, res.status, startTime);

      if (res.data?.error) {
        return {
          success: false,
          balance: 0,
          currency: 'USD',
          rawResponse: res.data
        };
      }

      return {
        success: true,
        balance: parseFloat(res.data?.balance || '0'),
        currency: res.data?.currency || 'USD',
        rawResponse: res.data
      };
    } catch (error: any) {
      return {
        success: false,
        balance: 0,
        currency: 'USD',
        rawResponse: error.response?.data || { error: error.message }
      };
    }
  }

  async validatePlayer(gameSlug: string, fields: Record<string, string>): Promise<{ valid: boolean; username?: string; message?: string; rawResponse?: any }> {
    const startTime = Date.now();
    const endpoint = `${this.apiUrl}/games/checkPlayerId`;
    const userId = fields.userId || fields.playerId || fields.uid || fields.riotId || fields.openId || fields.userCode || fields.playerTag || '';
    const zoneId = fields.zoneId || fields.serverId || '';

    // Map platform game slugs to G2Bulk official game codes
    const targetGameCodes = G2BULK_GAME_CODE_MAP[gameSlug] || [gameSlug.replace(/-/g, '_'), gameSlug.replace(/-/g, '')];

    for (const gCode of targetGameCodes) {
      const payload = {
        game: gCode,
        user_id: userId,
        userid: userId,
        zone_id: zoneId,
        zoneid: zoneId,
        serverid: zoneId,
        server_id: zoneId,
        player_id: userId
      };

      try {
        const res = await axios.post(endpoint, payload, {
          headers: {
            'x-api-key': env.G2BULK_API_KEY,
            'X-API-Key': env.G2BULK_API_KEY
          },
          timeout: 10000
        });
        await this.logExecution(endpoint, payload, res.data, res.status, startTime);

        if (res.data?.valid === 'valid' || res.data?.valid === true || res.data?.success === true) {
          const username = res.data?.name || res.data?.username || res.data?.nickname || `Player_${userId}`;
          return {
            valid: true,
            username,
            message: `Verified G2Bulk Player: ${username}`,
            rawResponse: res.data
          };
        }
      } catch (error: any) {
        const responseData = error.response?.data || { error: error.message };
        const statusCode = error.response?.status || 500;
        await this.logExecution(endpoint, payload, responseData, statusCode, startTime);

        if (responseData && responseData.valid === 'valid' && responseData.name) {
          return {
            valid: true,
            username: responseData.name,
            message: `Verified G2Bulk Player: ${responseData.name}`,
            rawResponse: responseData
          };
        }
      }
    }

    return {
      valid: false,
      message: 'Player not found in G2Bulk database',
      rawResponse: { valid: 'invalid' }
    };
  }
}
