import { BaseProviderAdapter } from './BaseProviderAdapter';
import { G2BulkAdapter } from './G2BulkAdapter';

export class ProviderFactory {
  private static instances: Map<string, BaseProviderAdapter> = new Map();

  static getProvider(providerType: string = 'G2BULK'): BaseProviderAdapter {
    const type = providerType.toUpperCase();

    if (!this.instances.has(type)) {
      switch (type) {
        case 'G2BULK':
          this.instances.set(type, new G2BulkAdapter());
          break;
        default:
          // Fallback to G2Bulk for modular extensible setup
          this.instances.set(type, new G2BulkAdapter());
          break;
      }
    }

    return this.instances.get(type)!;
  }
}
