/**
 * Service site configuration interface
 */
export interface ServiceSite {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Description information */
  description: string;
  /** Site category */
  category: 'source' | 'ai';
  /** URL template, using {REPO_PATH} as placeholder */
  urlTemplate: string;
  /** Icon identifier */
  icon: string;
  /** Whether enabled */
  enabled: boolean;
  /** Display order */
  order: number;
  /** Whether it's a built-in site */
  isBuiltIn: boolean;
  /** Shortcut key configuration */
  shortcuts?: {
    /** Shortcut key */
    key: string;
    /** Modifier keys */
    modifiers: string[];
    /** Whether enabled */
    enabled: boolean;
  };
}

/**
 * Extension settings configuration
 */
export interface ExtensionSettings {
  /** Default site ID */
  defaultSiteId: string;
  /** Whether to open in new tab */
  openInNewTab: boolean;
  /** Whether to show on hover */
  showOnHover: boolean;
  /** Whether to enable shortcuts */
  enableShortcuts: boolean;
}

/**
 * Complete extension configuration
 */
export interface ExtensionConfig {
  /** Sites list */
  sites: ServiceSite[];
  /** Extension settings */
  settings: ExtensionSettings;
  /** Configuration version, used for migration */
  version: string;
}

/**
 * Site creation input type
 */
export type CreateSiteInput = Omit<ServiceSite, 'id' | 'isBuiltIn' | 'order'>;

/**
 * Site update input type
 */
export type UpdateSiteInput = Partial<Omit<ServiceSite, 'id' | 'isBuiltIn'>>;

/**
 * Site category information
 */
export interface SiteCategory {
  id: 'source' | 'ai';
  name: string;
  description: string;
  icon: string;
}

/**
 * Configuration import/export format
 */
export interface ConfigExport {
  sites: ServiceSite[];
  settings: ExtensionSettings;
  exportDate: string;
  version: string;
}

/**
 * Shortcut key combination
 */
export interface ShortcutKey {
  key: string;
  modifiers: string[];
  enabled: boolean;
}

/**
 * Supported modifier keys
 */
export type ModifierKey = 'ctrl' | 'alt' | 'shift' | 'meta';

/**
 * Shortcut conflict detection result
 */
export interface ShortcutConflict {
  siteId: string;
  siteName: string;
  shortcut: ShortcutKey;
}
