import { ServiceSite, ExtensionConfig, CreateSiteInput, UpdateSiteInput, ExtensionSettings, ShortcutConflict, ShortcutKey } from './types';
import { StorageManager } from './storage';
import { DEFAULT_SITES, URL_TEMPLATE_REGEX, MAX_CUSTOM_SITES, MODIFIER_KEYS, SHORTCUT_KEYS } from './defaults';

/**
 * Configuration manager
 * Provides core functionality for site and settings management
 */
export class ConfigManager {
  /**
   * Get complete configuration
   */
  static async getConfig(): Promise<ExtensionConfig> {
    return StorageManager.getConfig();
  }

  /**
   * Save configuration
   */
  static async saveConfig(config: ExtensionConfig): Promise<void> {
    return StorageManager.saveConfig(config);
  }

  /**
   * Reset to default configuration
   */
  static async resetToDefault(): Promise<ExtensionConfig> {
    return StorageManager.resetToDefault();
  }

  // ========== Site Management ==========

  /**
   * Get all sites
   */
  static async getSites(): Promise<ServiceSite[]> {
    return StorageManager.getSites();
  }

  /**
   * Get enabled sites
   */
  static async getEnabledSites(): Promise<ServiceSite[]> {
    const sites = await this.getSites();
    return sites
      .filter(site => site.enabled)
      .sort((a, b) => a.order - b.order);
  }

  /**
   * Get sites by category
   */
  static async getSitesByCategory(): Promise<Record<'source' | 'ai', ServiceSite[]>> {
    const sites = await this.getEnabledSites();
    return {
      source: sites.filter(site => site.category === 'source'),
      ai: sites.filter(site => site.category === 'ai')
    };
  }

  /**
   * Get site by ID
   */
  static async getSiteById(id: string): Promise<ServiceSite | null> {
    const sites = await this.getSites();
    return sites.find(site => site.id === id) || null;
  }

  /**
   * Add new site
   */
  static async addSite(input: CreateSiteInput): Promise<ServiceSite> {
    const sites = await this.getSites();
    
    // Check if maximum count is exceeded
    const customSitesCount = sites.filter(site => !site.isBuiltIn).length;
    if (customSitesCount >= MAX_CUSTOM_SITES) {
      throw new Error(`Maximum ${MAX_CUSTOM_SITES} custom sites allowed`);
    }

    // Validate input
    this.validateSiteInput(input);

    // Generate unique ID
    const id = this.generateSiteId(input.name);
    
    // Check if ID already exists
    if (sites.some(site => site.id === id)) {
      throw new Error('Site ID already exists');
    }

    // Create new site
    const newSite: ServiceSite = {
      ...input,
      id,
      isBuiltIn: false,
      order: Math.max(...sites.map(s => s.order), 0) + 1
    };

    // Save
    const updatedSites = [...sites, newSite];
    await StorageManager.saveSites(updatedSites);
    
    return newSite;
  }

  /**
   * Update site
   */
  static async updateSite(id: string, updates: UpdateSiteInput): Promise<ServiceSite> {
    const sites = await this.getSites();
    const siteIndex = sites.findIndex(site => site.id === id);
    
    if (siteIndex === -1) {
      throw new Error('Site does not exist');
    }

    const currentSite = sites[siteIndex];
    
    // Validate update data
    if (updates.name || updates.urlTemplate || updates.category || updates.icon) {
      this.validateSiteInput({
        name: updates.name || currentSite.name,
        description: updates.description || currentSite.description,
        category: updates.category || currentSite.category,
        urlTemplate: updates.urlTemplate || currentSite.urlTemplate,
        icon: updates.icon || currentSite.icon,
        enabled: updates.enabled !== undefined ? updates.enabled : currentSite.enabled
      });
    }

    // Update site
    const updatedSite = {
      ...currentSite,
      ...updates
    };

    sites[siteIndex] = updatedSite;
    await StorageManager.saveSites(sites);
    
    return updatedSite;
  }

  /**
   * Delete site
   */
  static async deleteSite(id: string): Promise<void> {
    const sites = await this.getSites();
    const site = sites.find(s => s.id === id);
    
    if (!site) {
      throw new Error('Site does not exist');
    }

    if (site.isBuiltIn) {
      throw new Error('Built-in sites cannot be deleted, only disabled');
    }

    const updatedSites = sites.filter(s => s.id !== id);
    await StorageManager.saveSites(updatedSites);
  }

  /**
   * Toggle site enabled status
   */
  static async toggleSite(id: string, enabled: boolean): Promise<ServiceSite> {
    return this.updateSite(id, { enabled });
  }

  /**
   * Update site order
   */
  static async reorderSites(siteIds: string[]): Promise<ServiceSite[]> {
    const sites = await this.getSites();
    
    // Validate all IDs exist
    const existingIds = new Set(sites.map(s => s.id));
    const missingIds = siteIds.filter(id => !existingIds.has(id));
    if (missingIds.length > 0) {
      throw new Error(`Sites do not exist: ${missingIds.join(', ')}`);
    }

    // Create ID to site mapping
    const siteMap = new Map(sites.map(site => [site.id, site]));
    
    // Reorder by new sequence and update order
    const reorderedSites = siteIds.map((id, index) => ({
      ...siteMap.get(id)!,
      order: index + 1
    }));

    // Add sites not in the order list
    const unorderedSites = sites
      .filter(site => !siteIds.includes(site.id))
      .map((site, index) => ({
        ...site,
        order: reorderedSites.length + index + 1
      }));

    const allSites = [...reorderedSites, ...unorderedSites];
    await StorageManager.saveSites(allSites);
    
    return allSites;
  }

  /**
   * Generate site URL based on repository path
   */
  static generateSiteUrl(site: ServiceSite, repoPath: string): string {
    return site.urlTemplate.replace('{REPO_PATH}', repoPath);
  }

  // ========== Settings Management ==========

  /**
   * Get settings
   */
  static async getSettings(): Promise<ExtensionSettings> {
    return StorageManager.getSettings();
  }

  /**
   * Save settings
   */
  static async saveSettings(settings: ExtensionSettings): Promise<void> {
    return StorageManager.saveSettings(settings);
  }

  /**
   * Update single setting
   */
  static async updateSetting<K extends keyof ExtensionSettings>(
    key: K,
    value: ExtensionSettings[K]
  ): Promise<void> {
    const settings = await this.getSettings();
    settings[key] = value;
    await this.saveSettings(settings);
  }

  // ========== Import/Export ==========

  /**
   * Export configuration
   */
  static async exportConfig(): Promise<string> {
    return StorageManager.exportConfig();
  }

  /**
   * Import configuration
   */
  static async importConfig(configJson: string): Promise<ExtensionConfig> {
    return StorageManager.importConfig(configJson);
  }

  // ========== Helper Methods ==========

  /**
   * Validate site input
   */
  private static validateSiteInput(input: CreateSiteInput): void {
    if (!input.name || input.name.trim().length === 0) {
      throw new Error('Site name cannot be empty');
    }

    if (!input.urlTemplate || !URL_TEMPLATE_REGEX.test(input.urlTemplate)) {
      throw new Error('Invalid URL template format, must contain {REPO_PATH} placeholder');
    }

    if (!['source', 'ai'].includes(input.category)) {
      throw new Error('Site category must be source or ai');
    }

    if (!input.icon || input.icon.trim().length === 0) {
      throw new Error('Icon cannot be empty');
    }
  }

  /**
   * Generate site ID
   */
  private static generateSiteId(name: string): string {
    const base = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    return `custom-${base}-${Date.now()}`;
  }

  /**
   * Get default sites (for reset or initialization)
   */
  static getDefaultSites(): ServiceSite[] {
    return JSON.parse(JSON.stringify(DEFAULT_SITES));
  }

  // ========== Shortcut Management ==========

  /**
   * Update site shortcut
   */
  static async updateSiteShortcut(siteId: string, shortcut: ShortcutKey | null): Promise<ServiceSite> {
    const sites = await this.getSites();
    const siteIndex = sites.findIndex(site => site.id === siteId);
    
    if (siteIndex === -1) {
      throw new Error('Site does not exist');
    }

    // Check shortcut conflicts
    if (shortcut && shortcut.enabled) {
      const conflicts = this.checkShortcutConflicts(sites, siteId, shortcut);
      if (conflicts.length > 0) {
        throw new Error(`Shortcut conflict: ${conflicts.map(c => c.siteName).join(', ')}`);
      }
    }

    const updatedSite = {
      ...sites[siteIndex],
      shortcuts: shortcut || undefined
    };

    sites[siteIndex] = updatedSite;
    await StorageManager.saveSites(sites);
    
    return updatedSite;
  }

  /**
   * Get all shortcut mappings
   */
  static async getShortcutMapping(): Promise<Record<string, ServiceSite>> {
    const sites = await this.getEnabledSites();
    const mapping: Record<string, ServiceSite> = {};

    sites.forEach(site => {
      if (site.shortcuts?.enabled) {
        const shortcutStr = this.formatShortcutString(site.shortcuts);
        mapping[shortcutStr] = site;
      }
    });

    return mapping;
  }

  /**
   * Check shortcut conflicts
   */
  static checkShortcutConflicts(sites: ServiceSite[], excludeSiteId: string, shortcut: ShortcutKey): ShortcutConflict[] {
    const conflicts: ShortcutConflict[] = [];
    const shortcutStr = this.formatShortcutString(shortcut);

    sites.forEach(site => {
      if (site.id !== excludeSiteId && site.shortcuts?.enabled) {
        const existingShortcutStr = this.formatShortcutString(site.shortcuts);
        if (existingShortcutStr === shortcutStr) {
          conflicts.push({
            siteId: site.id,
            siteName: site.name,
            shortcut: site.shortcuts
          });
        }
      }
    });

    return conflicts;
  }

  /**
   * Format shortcut as string
   */
  static formatShortcutString(shortcut: ShortcutKey): string {
    const modifiers = shortcut.modifiers.sort();
    return [...modifiers, shortcut.key].join('+');
  }

  /**
   * Parse shortcut string
   */
  static parseShortcutString(shortcutStr: string): ShortcutKey | null {
    const parts = shortcutStr.split('+');
    if (parts.length < 2) return null;

    const key = parts.pop()!;
    const modifiers = parts;

    return {
      key,
      modifiers,
      enabled: true
    };
  }

  /**
   * Validate shortcut format
   */
  static validateShortcut(shortcut: ShortcutKey): boolean {
    // Check if there are modifier keys
    if (shortcut.modifiers.length === 0) {
      return false;
    }

    // Check if modifier keys are valid
    const validModifiers = MODIFIER_KEYS.map(m => m.value) as string[];
    if (!shortcut.modifiers.every(mod => validModifiers.includes(mod))) {
      return false;
    }

    // Check if main key is valid
    if (!SHORTCUT_KEYS.includes(shortcut.key as any)) {
      return false;
    }

    return true;
  }

  /**
   * Get suggested shortcut
   */
  static async getSuggestedShortcut(siteId: string): Promise<ShortcutKey | null> {
    const sites = await this.getSites();
    const usedShortcuts = new Set<string>();

    // Collect used shortcuts
    sites.forEach(site => {
      if (site.id !== siteId && site.shortcuts?.enabled) {
        const shortcutStr = this.formatShortcutString(site.shortcuts);
        usedShortcuts.add(shortcutStr);
      }
    });

    // Try to suggest shortcuts
    const baseModifiers = ['ctrl', 'shift'];
    for (const key of ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']) {
      const shortcutStr = this.formatShortcutString({
        key,
        modifiers: baseModifiers,
        enabled: true
      });
      
      if (!usedShortcuts.has(shortcutStr)) {
        return {
          key,
          modifiers: baseModifiers,
          enabled: true
        };
      }
    }

    return null;
  }
}

// Export configuration manager and related types
export * from './types';
export * from './defaults';
export { StorageManager } from './storage';
