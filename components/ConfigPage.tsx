import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { ExternalLink, Github, Search, FileText, Settings, Keyboard, Plus, Trash2, Edit, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import logoImage from '@/assets/logo.png';
import { ConfigManager, ServiceSite, ExtensionSettings } from '@/utils/config';
import { ShortcutEditor } from './ShortcutEditor';

interface ConfigPageProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function ConfigPage({ activeTab, onTabChange }: ConfigPageProps) {
  const { toast } = useToast();
  const [settings, setSettings] = useState<ExtensionSettings>({
    defaultSiteId: 'github_dev',
    openInNewTab: true,
    showOnHover: false,
    enableShortcuts: true
  });
  const [sites, setSites] = useState<ServiceSite[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load configuration data
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setIsLoading(true);
        const [loadedSettings, loadedSites] = await Promise.all([
          ConfigManager.getSettings(),
          ConfigManager.getSites()
        ]);
        setSettings(loadedSettings);
        setSites(loadedSites);
      } catch (error) {
        console.error('Failed to load configuration:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, []);

  const handleSave = async () => {
    try {
      await ConfigManager.saveSettings(settings);
      toast({
        title: i18n.t('config.save_success'),
        description: i18n.t('config.save_success_desc'),
        variant: "success",
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: i18n.t('config.save_failed'),
        description: i18n.t('config.save_failed_desc'),
        variant: "destructive",
      });
    }
  };

  const handleReset = async () => {
    try {
      const defaultConfig = await ConfigManager.resetToDefault();
      setSettings(defaultConfig.settings);
      setSites(defaultConfig.sites);
      toast({
        title: i18n.t('config.reset_success'),
        description: i18n.t('config.reset_success_desc'),
        variant: "success",
      });
    } catch (error) {
      console.error('Failed to reset settings:', error);
      toast({
        title: i18n.t('config.reset_failed'),
        description: i18n.t('config.reset_failed_desc'),
        variant: "destructive",
      });
    }
  };

  const handleToggleSite = async (siteId: string, enabled: boolean) => {
    try {
      await ConfigManager.toggleSite(siteId, enabled);
      setSites(prev => prev.map(site => 
        site.id === siteId ? { ...site, enabled } : site
      ));
      toast({
        title: enabled ? i18n.t('config.site_enabled') : i18n.t('config.site_disabled'),
        description: enabled ? i18n.t('config.site_enabled_desc') : i18n.t('config.site_disabled_desc'),
        variant: "success",
      });
    } catch (error) {
      console.error('Failed to toggle site status:', error);
      toast({
        title: i18n.t('config.operation_failed'),
        description: i18n.t('config.operation_failed_desc'),
        variant: "destructive",
      });
    }
  };

  const handleDeleteSite = async (siteId: string) => {
    if (!confirm(i18n.t('config.delete_confirm'))) return;
    
    try {
      await ConfigManager.deleteSite(siteId);
      setSites(prev => prev.filter(site => site.id !== siteId));
      toast({
        title: i18n.t('config.delete_success'),
        description: i18n.t('config.delete_success_desc'),
        variant: "success",
      });
    } catch (error) {
      console.error('Failed to delete site:', error);
      toast({
        title: i18n.t('config.delete_failed'),
        description: error instanceof Error ? error.message : i18n.t('config.delete_failed'),
        variant: "destructive",
      });
    }
  };

  if (activeTab === 'sites') {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="text-lg">{i18n.t('config.loading')}</div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div>
          <h2>{i18n.t('config.sites.title')}</h2>
          <p className="text-muted-foreground">{i18n.t('config.sites.description')}</p>
        </div>
        
        {/* Site list */}
        <Card>
          <CardHeader>
            <CardTitle>{i18n.t('config.sites.available_sites')}</CardTitle>
            <CardDescription>
              {i18n.t('config.sites.available_sites_desc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {sites.map((site) => (
              <div
                key={site.id}
                className={`flex items-center justify-between p-4 border rounded-lg ${
                  site.enabled ? 'bg-background' : 'bg-muted/50'
                }`}
              >
                <div className="flex items-center space-x-3 flex-1">
                  <div className="flex items-center gap-2">
                    {site.category === 'source' ? (
                      <FileText className="w-5 h-5" />
                    ) : (
                      <ExternalLink className="w-5 h-5" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{site.name}</span>
                        {site.isBuiltIn && (
                          <Badge variant="secondary" className="text-xs">
                            {i18n.t('config.sites.built_in')}
                          </Badge>
                        )}
                        <Badge 
                          variant={site.category === 'source' ? 'default' : 'outline'} 
                          className="text-xs"
                        >
                          {site.category === 'source' ? i18n.t('config.sites.source_reading') : i18n.t('config.sites.ai_analysis')}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{i18n.t(site.description)}</p>
                      <p className="text-xs text-muted-foreground mt-1">{site.urlTemplate}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleSite(site.id, !site.enabled)}
                    title={site.enabled ? i18n.t('config.sites.disable_site') : i18n.t('config.sites.enable_site')}
                  >
                    {site.enabled ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </Button>
                  
                  {!site.isBuiltIn && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // TODO: edit site functionality
                          toast({
                            title: i18n.t('config.feature_in_development'),
                            description: i18n.t('config.edit_feature_coming'),
                          });
                        }}
                        title={i18n.t('config.sites.edit_site')}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSite(site.id)}
                        title={i18n.t('config.sites.delete_site')}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
            
            {/* Add custom site button */}
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
              <Button
                variant="outline"
                onClick={() => {
                  // TODO: Implement add site functionality
                  toast({
                    title: i18n.t('config.feature_in_development'),
                    description: i18n.t('config.add_feature_coming'),
                  });
                }}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {i18n.t('config.sites.add_custom_site')}
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                {i18n.t('config.sites.max_sites_desc')}
              </p>
            </div>
          </CardContent>
        </Card>
        
        {/* Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>{i18n.t('config.sites.statistics')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{sites.length}</div>
                <p className="text-sm text-muted-foreground">{i18n.t('config.sites.total_sites')}</p>
              </div>
              <div>
                <div className="text-2xl font-bold">{sites.filter(s => s.enabled).length}</div>
                <p className="text-sm text-muted-foreground">{i18n.t('config.sites.enabled_sites')}</p>
              </div>
              <div>
                <div className="text-2xl font-bold">{sites.filter(s => !s.isBuiltIn).length}</div>
                <p className="text-sm text-muted-foreground">{i18n.t('config.sites.custom_sites')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (activeTab === 'shortcuts') {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="text-lg">{i18n.t('config.loading')}</div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div>
          <h2>{i18n.t('config.shortcuts.title')}</h2>
          <p className="text-muted-foreground">{i18n.t('config.shortcuts.description')}</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Keyboard className="w-5 h-5" />
              {i18n.t('config.shortcuts.global_settings')}
            </CardTitle>
            <CardDescription>
              {i18n.t('config.shortcuts.global_settings_desc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="enable-shortcuts">{i18n.t('config.shortcuts.enable_shortcuts')}</Label>
                <p className="text-sm text-muted-foreground">
                  {i18n.t('config.shortcuts.enable_shortcuts_desc')}
                </p>
              </div>
              <Switch
                id="enable-shortcuts"
                checked={settings.enableShortcuts}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, enableShortcuts: checked }))
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{i18n.t('config.shortcuts.site_shortcuts')}</CardTitle>
            <CardDescription>
              {i18n.t('config.shortcuts.site_shortcuts_desc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {sites.map((site) => (
              <div
                key={site.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {site.category === 'source' ? (
                    <FileText className="w-5 h-5" />
                  ) : (
                    <ExternalLink className="w-5 h-5" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{site.name}</span>
                      <Badge 
                        variant={site.category === 'source' ? 'default' : 'outline'} 
                        className="text-xs"
                      >
                        {site.category === 'source' ? i18n.t('config.sites.source_reading') : i18n.t('config.sites.ai_analysis')}
                      </Badge>
                      {!site.enabled && (
                        <Badge variant="secondary" className="text-xs">
                          {i18n.t('config.shortcuts.disabled_site')}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{i18n.t(site.description)}</p>
                  </div>
                </div>
                
                <div className="min-w-[200px]">
                  {site.enabled ? (
                    <ShortcutEditor 
                      site={site} 
                      onUpdate={(updatedSite) => {
                        setSites(prev => prev.map(s => s.id === updatedSite.id ? updatedSite : s));
                      }}
                    />
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {i18n.t('config.shortcuts.site_disabled_desc')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{i18n.t('config.shortcuts.usage_instructions')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-muted-foreground">1.</span>
              <span>{i18n.t('config.shortcuts.usage_1')}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-muted-foreground">2.</span>
              <span>{i18n.t('config.shortcuts.usage_2')}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-muted-foreground">3.</span>
              <span>{i18n.t('config.shortcuts.usage_3')}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-muted-foreground">4.</span>
              <span>{i18n.t('config.shortcuts.usage_4')}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (activeTab === 'about') {
    return (
      <div className="space-y-6">
        <div>
          <h2>{i18n.t('config.about.title')}</h2>
          <p className="text-muted-foreground">{i18n.t('config.about.description')}</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <img src={logoImage} alt="Extension Logo" className="w-8 h-8" />
              {i18n.t('config.about.extension_name')}
            </CardTitle>
            <CardDescription>
              {i18n.t('config.about.extension_desc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label>{i18n.t('config.about.version')}</Label>
                <p className="text-muted-foreground">1.0.0</p>
              </div>
              <div>
                <Label>{i18n.t('config.about.type')}</Label>
                <p className="text-muted-foreground">{i18n.t('config.about.chrome_extension')}</p>
              </div>
              <div>
                <Label>{i18n.t('config.about.manifest')}</Label>
                <p className="text-muted-foreground">V3</p>
              </div>
              <div>
                <Label>{i18n.t('config.about.permissions')}</Label>
                <p className="text-muted-foreground">activeTab, storage</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>{i18n.t('config.about.supported_platforms')}</Label>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Sourcegraph</Badge>
                <Badge variant="secondary">GitHub.dev</Badge>
                <Badge variant="secondary">GitHub1S</Badge>
                <Badge variant="secondary">ZRead</Badge>
                <Badge variant="secondary">DeepWiki</Badge>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                {i18n.t('config.about.extension_info')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2>{i18n.t('config.general.title')}</h2>
        <p className="text-muted-foreground">{i18n.t('config.general.description')}</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{i18n.t('config.general.default_target_title')}</CardTitle>
          <CardDescription>
            {i18n.t('config.general.default_target_desc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={settings.defaultSiteId}
            onValueChange={(value) => setSettings(prev => ({ ...prev, defaultSiteId: value }))}
          >
            {sites.filter(site => site.enabled).map((site) => (
              <Label key={site.id} htmlFor={site.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent w-full cursor-pointer">
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value={site.id} id={site.id} />
                  <div>
                    <div className="flex items-center gap-2">
                      {site.category === 'source' ? (
                        <FileText className="w-5 h-5" />
                      ) : (
                        <ExternalLink className="w-5 h-5" />
                      )}
                      <span>{site.name}</span>
                      <Badge 
                        variant={site.category === 'source' ? 'default' : 'outline'} 
                        className="text-xs"
                      >
                        {site.category === 'source' ? i18n.t('config.sites.source_reading') : i18n.t('config.sites.ai_analysis')}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{i18n.t(site.description)}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {new URL(site.urlTemplate.replace('{REPO_PATH}', 'example/repo')).hostname}
                </Badge>
              </Label>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{i18n.t('config.general.open_method_title')}</CardTitle>
          <CardDescription>
            {i18n.t('config.general.open_method_desc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="new-tab">{i18n.t('config.general.new_tab_label')}</Label>
              <p className="text-sm text-muted-foreground">
                {i18n.t('config.general.new_tab_desc')}
              </p>
            </div>
            <Switch
              id="new-tab"
              checked={settings.openInNewTab}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, openInNewTab: checked }))
              }
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button onClick={handleSave} className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          {i18n.t('config.general.save_settings')}
        </Button>
        <Button variant="outline" onClick={handleReset} className="flex items-center gap-2">
          <Settings className="w-4 h-4" />
          {i18n.t('config.general.reset_default')}
        </Button>
      </div>
    </div>
  );
}