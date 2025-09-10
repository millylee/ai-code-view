import { useState, useRef, useEffect } from "react";
import { ConfigManager, ServiceSite, ExtensionSettings } from "../../utils/config";

interface AppProps {
  repoPath: string;
}

export function App({ repoPath }: AppProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [sites, setSites] = useState<{ source: ServiceSite[]; ai: ServiceSite[] }>({
    source: [],
    ai: []
  });
  const [settings, setSettings] = useState<ExtensionSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load site configuration and settings
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setIsLoading(true);
        const [categorizedSites, userSettings] = await Promise.all([
          ConfigManager.getSitesByCategory(),
          ConfigManager.getSettings()
        ]);
        setSites(categorizedSites);
        setSettings(userSettings);
      } catch (error) {
        console.error(i18n.t('content.app.loading_config_failed'), error);
        // Use default configuration
        const defaultSites = ConfigManager.getDefaultSites();
        setSites({
          source: defaultSites.filter(site => site.category === 'source' && site.enabled),
          ai: defaultSites.filter(site => site.category === 'ai' && site.enabled)
        });
        // Set default settings
        setSettings({
          defaultSiteId: 'github_dev',
          openInNewTab: true,
          showOnHover: false,
          enableShortcuts: true
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, []);

  // Set up shortcut listener
  useEffect(() => {
    if (!settings?.enableShortcuts) {
      console.log(i18n.t('content.app.shortcuts_disabled'));
      return;
    }

    console.log(i18n.t('content.app.shortcuts_enabled'));

    const handleKeydown = async (event: KeyboardEvent) => {
      // Ignore keypresses in input fields
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Build current key combination
      const modifiers: string[] = [];
      if (event.ctrlKey) modifiers.push('ctrl');
      if (event.altKey) modifiers.push('alt');
      if (event.shiftKey) modifiers.push('shift');
      if (event.metaKey) modifiers.push('meta');

      // Get main key
      let key = event.key.toLowerCase();
      if (key.startsWith('f') && key.length > 1) {
        // F1-F12 function keys
        key = key.toUpperCase();
      }

      // Only handle combinations with modifier keys
      if (modifiers.length === 0) {
        return;
      }

      // Build shortcut string
      const shortcutStr = ConfigManager.formatShortcutString({
        key,
        modifiers,
        enabled: true
      });

      console.log(i18n.t('content.app.key_detected'), shortcutStr);

      // Get shortcut mapping
      try {
        const shortcutMapping = await ConfigManager.getShortcutMapping();
        console.log(i18n.t('content.app.shortcut_mapping'), shortcutMapping);
        
        const targetSite = shortcutMapping[shortcutStr];

        if (targetSite) {
          console.log(i18n.t('content.app.site_matched'), targetSite.name);
          
          event.preventDefault();
          event.stopPropagation();

          const url = ConfigManager.generateSiteUrl(targetSite, repoPath);
          console.log(i18n.t('content.app.opening_url'), url);
          
          // Decide opening method based on settings
          if (settings.openInNewTab) {
            window.open(url, "_blank", "noopener,noreferrer");
          } else {
            window.location.href = url;
          }
        } else {
          console.log(i18n.t('content.app.no_matching_site'));
        }
      } catch (error) {
        console.error(i18n.t('content.app.shortcut_processing_failed'), error);
      }
    };

    document.addEventListener('keydown', handleKeydown, true); // Use capture mode

    return () => {
      document.removeEventListener('keydown', handleKeydown, true);
      console.log(i18n.t('content.app.shortcuts_removed'));
    };
  }, [settings, repoPath]);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleSiteClick = (site: ServiceSite, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = ConfigManager.generateSiteUrl(site, repoPath);
    
    // Decide opening method based on user settings
    if (settings?.openInNewTab) {
      // Open in new tab
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      // Open in current tab
      window.location.href = url;
    }
    
    setIsOpen(false);
  };

  const handleDefaultSiteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!settings) return;
    
    // Find default site (only search in enabled sites)
    const allSites = [...sites.source, ...sites.ai];
    const defaultSite = allSites.find(site => site.id === settings.defaultSiteId);
    
    if (defaultSite) {
      const url = ConfigManager.generateSiteUrl(defaultSite, repoPath);
      
      // Decide opening method based on user settings
      if (settings.openInNewTab) {
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        window.location.href = url;
      }
    } else {
      // If default site not found or disabled, use first available site
      const firstAvailableSite = allSites[0];
      if (firstAvailableSite) {
        const url = ConfigManager.generateSiteUrl(firstAvailableSite, repoPath);
        if (settings.openInNewTab) {
          window.open(url, "_blank", "noopener,noreferrer");
        } else {
          window.location.href = url;
        }
        console.warn(i18n.t('content.app.default_site_unavailable'), firstAvailableSite.name);
      } else {
        console.warn(i18n.t('content.app.no_available_sites'));
      }
    }
    
    setIsOpen(false);
  };

  // If loading configuration, show loading state
  if (isLoading || !settings) {
    return (
      <div className="read-button-container">
        <button className="read-button" disabled>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 16A8 8 0 1 1 8 0a8 8 0 0 1 0 16ZM6.5 5.5a.5.5 0 0 0-1 0v5a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 0-1H6.5V5.5Z" />
          </svg>
          {i18n.t('content.app.loading')}
        </button>
      </div>
    );
  }

  // If no available sites, don't show button
  const totalSites = sites.source.length + sites.ai.length;
  if (totalSites === 0) {
    return null;
  }

  // Get default site information for display
  const allSites = [...sites.source, ...sites.ai];
  const defaultSite = settings ? allSites.find(site => site.id === settings.defaultSiteId) : null;

  return (
    <div
      className="read-button-container"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button 
        className="read-button"
        onClick={handleDefaultSiteClick}
        title={defaultSite ? i18n.t('content.app.click_to_jump', [defaultSite.name]) : i18n.t('content.app.click_to_read')}
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 16A8 8 0 1 1 8 0a8 8 0 0 1 0 16ZM6.5 5.5a.5.5 0 0 0-1 0v5a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 0-1H6.5V5.5Z" />
        </svg>
        {i18n.t('content.app.read')}
        <svg width="8" height="8" viewBox="0 0 16 16" fill="currentColor">
          <path d="M4.427 9.573L8 13.146l3.573-3.573A.5.5 0 0 0 11.5 9h-7a.5.5 0 0 0-.073.573Z" />
        </svg>
      </button>

      <div className={`read-dropdown ${isOpen ? "show" : ""}`}>
        {/* AI Analysis Sites */}
        {sites.ai.length > 0 && (
          <>
            <div className="dropdown-header">{i18n.t('content.app.ai_analysis')}</div>
            {sites.ai.map((site) => (
              <div
                key={site.id}
                className="dropdown-item"
                onClick={(e) => handleSiteClick(site, e)}
                title={i18n.t(site.description)}
              >
                {site.name}
                {settings?.defaultSiteId === site.id && (
                  <span className="default-indicator">{i18n.t('content.app.default_indicator')}</span>
                )}
              </div>
            ))}
          </>
        )}
        
        {/* Separator */}
        {sites.ai.length > 0 && sites.source.length > 0 && (
          <div className="dropdown-separator" />
        )}

        {/* Source Reading Sites */}
        {sites.source.length > 0 && (
          <>
            <div className="dropdown-header">{i18n.t('content.app.source_reading')}</div>
            {sites.source.map((site) => (
              <div
                key={site.id}
                className="dropdown-item"
                onClick={(e) => handleSiteClick(site, e)}
                title={i18n.t(site.description)}
              >
                {site.name}
                {settings?.defaultSiteId === site.id && (
                  <span className="default-indicator">{i18n.t('content.app.default_indicator')}</span>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
