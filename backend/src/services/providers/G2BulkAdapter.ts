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
import { redactProviderLogData, redactSensitiveUrl } from '../../utils/redaction';

export const G2BULK_GAME_CODE_MAP: Record<string, string[]> = {
  'mobile-legends': ['mlbb', 'mobile_legends', 'mobilelegends', 'mlbb_global', 'ml', 'mobile_legend', 'mlbb_special', 'mlbb_exclusive'],
  'free-fire': ['freefire_global'],
  'pubg-mobile': ['pubg'],
  'valorant': ['valorant_ph'],
  'honor-of-kings': ['hok'],
  'cod-mobile': ['garena_undawn', 'codm'],
  'blood-strike': ['blood_strike', 'bloodstrike'],
  'delta-force': ['delta_force', 'deltaforce'],
  'genshin-impact': ['genshin']
};

export function extractRealNickname(data: any): string | null {
  if (!data || typeof data !== 'object') return null;

  const candidates = [
    data.name,
    data.username,
    data.nickname,
    data.player_name,
    data.player_username,
    data.user_name,
    typeof data.result === 'string' ? data.result : null,
    data.result?.name,
    data.result?.username,
    data.result?.nickname,
    data.result?.player_name,
    data.data?.name,
    data.data?.username,
    data.data?.nickname,
    data.data?.player_name,
    data.data?.user_name
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      const trimmed = candidate.trim();
      if (!/invalid|error|not found|failed|incorrect|unauthorized|denied|maintenance|false|null|undefined/i.test(trimmed)) {
        return trimmed;
      }
    }
  }

  return null;
}

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
        endpoint: redactSensitiveUrl(endpoint),
        requestPayload: redactProviderLogData(
          typeof requestPayload === 'object' ? requestPayload : { raw: requestPayload }
        ) as Record<string, any>,
        responsePayload: redactProviderLogData(
          typeof responsePayload === 'object' ? responsePayload : { raw: responsePayload }
        ) as Record<string, any>,
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
    const userId = (fields.userId || fields.playerId || fields.uid || fields.riotId || fields.openId || fields.userCode || fields.playerTag || '').trim();
    const zoneId = (fields.zoneId || fields.serverId || '').trim();

    if (!userId) {
      return {
        valid: false,
        message: 'Player ID is required for verification',
        rawResponse: { valid: 'invalid' }
      };
    }

    // In sandbox / mock mode fallback if API key is not configured or is sample or in test environment
    if (!env.G2BULK_API_KEY || env.G2BULK_API_KEY.includes('sample') || env.NODE_ENV === 'test') {
      const mockUsername = `KiyoPlayer_${userId}${zoneId ? ` (${zoneId})` : ''}`;
      return {
        valid: true,
        username: mockUsername,
        message: `Verified G2Bulk Player: ${mockUsername}`,
        rawResponse: { valid: 'valid', name: mockUsername, mock: true }
      };
    }

    const formUrl = 'https://api.g2bulk.com/api/v2';
    const jsonUrl = 'https://api.g2bulk.com/v1/games/checkPlayerId';
    const targetGameCodes = G2BULK_GAME_CODE_MAP[gameSlug] || [gameSlug.replace(/-/g, '_'), gameSlug.replace(/-/g, '')];
    const primaryGCode = targetGameCodes[0];
    const link = zoneId ? `${userId}|${zoneId}` : userId;

    const tasks: Promise<{ valid: boolean; username: string; rawResponse: any } | null>[] = [];

    // 1. Parallel G2Bulk v2 Form Action requests
    const primaryActions = ['get-user-id', 'checkid', 'check'];
    for (const gCode of [primaryGCode, ...targetGameCodes.slice(1, 3)].filter(Boolean)) {
      for (const actionName of primaryActions) {
        const formParams = new URLSearchParams();
        formParams.append('key', env.G2BULK_API_KEY);
        formParams.append('action', actionName);
        formParams.append('service', gCode);
        formParams.append('game', gCode);
        formParams.append('link', link);
        formParams.append('target', link);
        formParams.append('user_id', userId);
        if (zoneId) {
          formParams.append('zone_id', zoneId);
          formParams.append('server_id', zoneId);
        }

        tasks.push(
          axios.post(formUrl, formParams, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            timeout: 3000
          }).then((res) => {
            const realName = extractRealNickname(res.data);
            if (realName) {
              return { valid: true, username: realName, rawResponse: res.data };
            }
            return null;
          }).catch(() => null)
        );
      }
    }

    // 2. Parallel G2Bulk v1 Dedicated JSON Endpoint requests (/v1/games/checkPlayerId)
    for (const gCode of [primaryGCode, ...targetGameCodes.slice(1, 3)].filter(Boolean)) {
      const payload = {
        game: gCode,
        service: gCode,
        user_id: userId,
        userid: userId,
        zone_id: zoneId,
        zoneid: zoneId,
        server_id: zoneId,
        serverid: zoneId,
        player_id: userId
      };

      tasks.push(
        axios.post(jsonUrl, payload, {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': env.G2BULK_API_KEY,
            'X-API-Key': env.G2BULK_API_KEY
          },
          timeout: 3000
        }).then((res) => {
          const realName = extractRealNickname(res.data);
          if (realName) {
            return { valid: true, username: realName, rawResponse: res.data };
          }
          return null;
        }).catch((err) => {
          const realName = extractRealNickname(err.response?.data);
          if (realName) {
            return { valid: true, username: realName, rawResponse: err.response?.data };
          }
          return null;
        })
      );
    }

    // 3. User configured custom URL fallback support
    const userConfiguredUrl = this.apiUrl ? this.apiUrl.replace(/\/$/, '') : null;
    if (userConfiguredUrl) {
      const customFormUrl = userConfiguredUrl.includes('/v1')
        ? userConfiguredUrl.replace('/v1', '/api/v2')
        : userConfiguredUrl;
      const customJsonUrl = userConfiguredUrl.includes('/api/v2')
        ? userConfiguredUrl.replace('/api/v2', '/v1')
        : userConfiguredUrl;

      // Custom form action
      const formParams = new URLSearchParams();
      formParams.append('key', env.G2BULK_API_KEY);
      formParams.append('action', 'get-user-id');
      formParams.append('service', primaryGCode);
      formParams.append('game', primaryGCode);
      formParams.append('link', link);
      formParams.append('target', link);
      formParams.append('user_id', userId);
      if (zoneId) {
        formParams.append('zone_id', zoneId);
        formParams.append('server_id', zoneId);
      }

      tasks.push(
        axios.post(customFormUrl, formParams, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          timeout: 3000
        }).then((res) => {
          const realName = extractRealNickname(res.data);
          if (realName) return { valid: true, username: realName, rawResponse: res.data };
          return null;
        }).catch(() => null)
      );

      // Custom json action
      const payload = {
        game: primaryGCode,
        service: primaryGCode,
        user_id: userId,
        userid: userId,
        zone_id: zoneId,
        zoneid: zoneId,
        server_id: zoneId,
        serverid: zoneId,
        player_id: userId
      };

      tasks.push(
        axios.post(`${customJsonUrl}/games/checkPlayerId`, payload, {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': env.G2BULK_API_KEY,
            'X-API-Key': env.G2BULK_API_KEY
          },
          timeout: 3000
        }).then((res) => {
          const realName = extractRealNickname(res.data);
          if (realName) return { valid: true, username: realName, rawResponse: res.data };
          return null;
        }).catch(() => null)
      );
    }

    const results = await Promise.allSettled(tasks);
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value?.valid) {
        const username = result.value.username;
        return {
          valid: true,
          username,
          message: `Verified G2Bulk Player: ${username}`,
          rawResponse: result.value.rawResponse
        };
      }
    }

    return {
      valid: false,
      message: 'Player not found in G2Bulk database',
      rawResponse: { valid: 'invalid' }
    };
  }
}
