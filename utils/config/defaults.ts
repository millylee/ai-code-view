import { ServiceSite, ExtensionSettings, ExtensionConfig, SiteCategory } from './types';

/**
 * Site category definitions
 */
export const SITE_CATEGORIES: SiteCategory[] = [
  {
    id: 'source',
    name: 'sites.categories.source.name', // i18n key
    description: 'sites.categories.source.description', // i18n key
    icon: 'file-text'
  },
  {
    id: 'ai',
    name: 'sites.categories.ai.name', // i18n key
    description: 'sites.categories.ai.description', // i18n key
    icon: 'brain'
  }
];

/**
 * Default built-in site configurations
 * Note: Site names and descriptions should be obtained through i18n
 */
export const DEFAULT_SITES: ServiceSite[] = [
  {
    id: 'github1s',
    name: 'GitHub1s',
    description: 'sites.descriptions.github1s', // i18n key
    category: 'source',
    urlTemplate: 'https://github1s.com/{REPO_PATH}',
    icon: 'github',
    enabled: true,
    order: 1,
    isBuiltIn: true,
    shortcuts: {
      key: '1',
      modifiers: ['ctrl', 'shift'],
      enabled: true
    }
  },
  {
    id: 'github_dev',
    name: 'GitHub.dev',
    description: 'sites.descriptions.github_dev', // i18n key
    category: 'source',
    urlTemplate: 'https://github.dev/{REPO_PATH}/',
    icon: 'github',
    enabled: true,
    order: 2,
    isBuiltIn: true,
    shortcuts: {
      key: '2',
      modifiers: ['ctrl', 'shift'],
      enabled: true
    }
  },
  {
    id: 'sourcegraph',
    name: 'Sourcegraph',
    description: 'sites.descriptions.sourcegraph', // i18n key
    category: 'source',
    urlTemplate: 'https://sourcegraph.com/github.com/{REPO_PATH}',
    icon: 'search',
    enabled: true,
    order: 3,
    isBuiltIn: true,
    shortcuts: {
      key: '3',
      modifiers: ['ctrl', 'shift'],
      enabled: true
    }
  },
  {
    id: 'zread',
    name: 'ZRead',
    description: 'sites.descriptions.zread', // i18n key
    category: 'ai',
    urlTemplate: 'https://zread.ai/{REPO_PATH}',
    icon: 'external-link',
    enabled: true,
    order: 4,
    isBuiltIn: true,
    shortcuts: {
      key: '4',
      modifiers: ['ctrl', 'shift'],
      enabled: true
    }
  },
  {
    id: 'deepwiki',
    name: 'DeepWiki',
    description: 'sites.descriptions.deepwiki', // i18n key
    category: 'ai',
    urlTemplate: 'https://deepwiki.com/{REPO_PATH}',
    icon: 'file-text',
    enabled: true,
    order: 5,
    isBuiltIn: true,
    shortcuts: {
      key: '5',
      modifiers: ['ctrl', 'shift'],
      enabled: true
    }
  }
];

/**
 * Default extension settings
 */
export const DEFAULT_SETTINGS: ExtensionSettings = {
  defaultSiteId: 'github_dev',
  openInNewTab: true,
  showOnHover: false,
  enableShortcuts: true
};

/**
 * Default complete configuration
 */
export const DEFAULT_CONFIG: ExtensionConfig = {
  sites: DEFAULT_SITES,
  settings: DEFAULT_SETTINGS,
  version: '1.0.0'
};

/**
 * Configuration storage keys
 */
export const STORAGE_KEYS = {
  CONFIG: 'ai-code-view-config',
  SITES: 'ai-code-view-sites',
  SETTINGS: 'ai-code-view-settings',
  VERSION: 'ai-code-view-version'
} as const;

/**
 * Supported icon list
 */
export const AVAILABLE_ICONS = [
  'github',
  'search',
  'external-link',
  'file-text',
  'brain',
  'code',
  'globe',
  'zap',
  'star',
  'heart',
  'bookmark',
  'tag'
] as const;

/**
 * URL template validation regex
 */
export const URL_TEMPLATE_REGEX = /^https?:\/\/.+\{repoPath\}.*/;

/**
 * Maximum custom sites count
 */
export const MAX_CUSTOM_SITES = 20;

/**
 * Supported modifier keys
 */
export const MODIFIER_KEYS = [
  { value: 'ctrl', label: 'Ctrl', symbol: 'Ctrl' },
  { value: 'alt', label: 'Alt', symbol: 'Alt' },
  { value: 'shift', label: 'Shift', symbol: '⇧' },
  { value: 'meta', label: 'Meta', symbol: '⌘' }
] as const;

/**
 * Supported shortcut keys
 */
export const SHORTCUT_KEYS = [
  '1', '2', '3', '4', '5', '6', '7', '8', '9', '0',
  'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
  'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
  'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'
] as const;
