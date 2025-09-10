import { ExtensionConfig, ServiceSite, ExtensionSettings } from './types';
import { DEFAULT_CONFIG, STORAGE_KEYS } from './defaults';

/**
 * Browser storage manager
 */
export class StorageManager {
  /**
   * Get complete configuration
   */
  static async getConfig(): Promise<ExtensionConfig> {
    try {
      const result = await browser.storage.sync.get(STORAGE_KEYS.CONFIG);
      const config = result[STORAGE_KEYS.CONFIG];
      
      if (config && this.isValidConfig(config)) {
        return this.migrateConfig(config);
      }
    } catch (error) {
      console.error('Failed to read configuration:', error);
    }
    
    // Return default configuration
    return this.getDefaultConfig();
  }

  /**
   * Save complete configuration
   */
  static async saveConfig(config: ExtensionConfig): Promise<void> {
    try {
      // Validate configuration
      if (!this.isValidConfig(config)) {
        throw new Error('Invalid configuration format');
      }

      const configToSave = {
        ...config,
        version: DEFAULT_CONFIG.version
      };

      await browser.storage.sync.set({
        [STORAGE_KEYS.CONFIG]: configToSave
      });
    } catch (error) {
      console.error('Failed to save configuration:', error);
      throw error;
    }
  }

  /**
   * Get sites list
   */
  static async getSites(): Promise<ServiceSite[]> {
    const config = await this.getConfig();
    return config.sites;
  }

  /**
   * Save sites list
   */
  static async saveSites(sites: ServiceSite[]): Promise<void> {
    const config = await this.getConfig();
    await this.saveConfig({
      ...config,
      sites
    });
  }

  /**
   * Get settings
   */
  static async getSettings(): Promise<ExtensionSettings> {
    const config = await this.getConfig();
    return config.settings;
  }

  /**
   * Save settings
   */
  static async saveSettings(settings: ExtensionSettings): Promise<void> {
    const config = await this.getConfig();
    await this.saveConfig({
      ...config,
      settings
    });
  }

  /**
   * Reset to default configuration
   */
  static async resetToDefault(): Promise<ExtensionConfig> {
    const defaultConfig = this.getDefaultConfig();
    await this.saveConfig(defaultConfig);
    return defaultConfig;
  }

  /**
   * Clear all configurations
   */
  static async clearAll(): Promise<void> {
    try {
      await browser.storage.sync.remove(Object.values(STORAGE_KEYS));
    } catch (error) {
      console.error('Failed to clear configuration:', error);
      throw error;
    }
  }

  /**
   * Export configuration
   */
  static async exportConfig(): Promise<string> {
    const config = await this.getConfig();
    const exportData = {
      ...config,
      exportDate: new Date().toISOString()
    };
    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import configuration
   */
  static async importConfig(configJson: string): Promise<ExtensionConfig> {
    try {
      const importedConfig = JSON.parse(configJson);
      
      // Validate imported configuration
      if (!this.isValidConfig(importedConfig)) {
        throw new Error('Invalid imported configuration format');
      }

      // Merge imported configuration with default configuration
      const mergedConfig = this.mergeWithDefault(importedConfig);
      await this.saveConfig(mergedConfig);
      return mergedConfig;
    } catch (error) {
      console.error('Failed to import configuration:', error);
      throw error;
    }
  }

  /**
   * Get default configuration
   */
  private static getDefaultConfig(): ExtensionConfig {
    return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  }

  /**
   * Validate configuration format
   */
  private static isValidConfig(config: any): config is ExtensionConfig {
    return (
      config &&
      typeof config === 'object' &&
      Array.isArray(config.sites) &&
      config.settings &&
      typeof config.settings === 'object'
    );
  }

  /**
   * Configuration migration
   */
  private static migrateConfig(config: ExtensionConfig): ExtensionConfig {
    // If version doesn't match, perform migration logic
    if (config.version !== DEFAULT_CONFIG.version) {
      console.log(`Configuration migrated from ${config.version} to ${DEFAULT_CONFIG.version}`);
      
      // Migrate site configuration, ensure shortcuts have enabled field
      const migratedSites = config.sites.map(site => ({
        ...site,
        shortcuts: site.shortcuts ? {
          ...site.shortcuts,
          enabled: site.shortcuts.enabled !== undefined ? site.shortcuts.enabled : true
        } : site.shortcuts
      }));
      
      return {
        ...config,
        sites: migratedSites,
        version: DEFAULT_CONFIG.version
      };
    }
    
    return config;
  }

  /**
   * Merge with default configuration
   */
  private static mergeWithDefault(config: Partial<ExtensionConfig>): ExtensionConfig {
    const defaultConfig = this.getDefaultConfig();
    
    return {
      version: DEFAULT_CONFIG.version,
      sites: config.sites || defaultConfig.sites,
      settings: {
        ...defaultConfig.settings,
        ...config.settings
      }
    };
  }
}
