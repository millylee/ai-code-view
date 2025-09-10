import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { ConfigManager, ServiceSite, ShortcutKey, MODIFIER_KEYS, SHORTCUT_KEYS } from '@/utils/config';
import { X, Edit, Keyboard } from 'lucide-react';

interface ShortcutEditorProps {
  site: ServiceSite;
  onUpdate: (site: ServiceSite) => void;
}

export function ShortcutEditor({ site, onUpdate }: ShortcutEditorProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [tempShortcut, setTempShortcut] = useState<ShortcutKey | null>(null);
  const [conflicts, setConflicts] = useState<string[]>([]);

  useEffect(() => {
    if (isEditing && site.shortcuts) {
      setTempShortcut({ ...site.shortcuts });
    }
  }, [isEditing, site.shortcuts]);

  const handleStartEdit = () => {
    setIsEditing(true);
    if (!site.shortcuts) {
      // Get recommended shortcut
      ConfigManager.getSuggestedShortcut(site.id).then(suggested => {
        if (suggested) {
          setTempShortcut(suggested);
        } else {
          setTempShortcut({
            key: '1',
            modifiers: ['ctrl', 'shift'],
            enabled: true
          });
        }
      });
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setTempShortcut(null);
    setConflicts([]);
  };

  const handleSave = async () => {
    if (!tempShortcut) return;

    try {
      // Validate shortcut format
      if (!ConfigManager.validateShortcut(tempShortcut)) {
              toast({
        title: i18n.t('shortcut.invalid_shortcut'),
        description: i18n.t('shortcut.invalid_shortcut_desc'),
        variant: "destructive",
      });
        return;
      }

      const updatedSite = await ConfigManager.updateSiteShortcut(site.id, tempShortcut);
      onUpdate(updatedSite);
      setIsEditing(false);
      setTempShortcut(null);
      setConflicts([]);
      
      toast({
        title: i18n.t('shortcut.shortcut_updated'),
        description: i18n.t('shortcut.shortcut_updated_desc', [site.name, formatShortcutDisplay(tempShortcut)]),
        variant: "success",
      });
    } catch (error) {
      toast({
        title: i18n.t('shortcut.set_failed'),
        description: error instanceof Error ? error.message : i18n.t('shortcut.set_failed'),
        variant: "destructive",
      });
    }
  };

  const handleRemove = async () => {
    try {
      const updatedSite = await ConfigManager.updateSiteShortcut(site.id, null);
      onUpdate(updatedSite);
      
      toast({
        title: i18n.t('shortcut.shortcut_removed'),
        description: i18n.t('shortcut.shortcut_removed_desc', [site.name]),
        variant: "success",
      });
    } catch (error) {
      toast({
        title: i18n.t('shortcut.remove_failed'),
        description: error instanceof Error ? error.message : i18n.t('shortcut.remove_failed'),
        variant: "destructive",
      });
    }
  };

  const handleToggleEnabled = async () => {
    if (!site.shortcuts) return;

    const updatedShortcut = {
      ...site.shortcuts,
      enabled: !site.shortcuts.enabled
    };

    try {
      const updatedSite = await ConfigManager.updateSiteShortcut(site.id, updatedShortcut);
      onUpdate(updatedSite);
      
      toast({
        title: updatedShortcut.enabled ? i18n.t('shortcut.shortcut_enabled') : i18n.t('shortcut.shortcut_disabled'),
        description: updatedShortcut.enabled ? 
          i18n.t('shortcut.shortcut_enabled_desc', [site.name]) : 
          i18n.t('shortcut.shortcut_disabled_desc', [site.name]),
        variant: "success",
      });
    } catch (error) {
      toast({
        title: i18n.t('config.operation_failed'),
        description: error instanceof Error ? error.message : i18n.t('config.operation_failed'),
        variant: "destructive",
      });
    }
  };

  const updateModifier = (modifier: string, checked: boolean) => {
    if (!tempShortcut) return;

    let newModifiers = [...tempShortcut.modifiers];
    if (checked) {
      if (!newModifiers.includes(modifier)) {
        newModifiers.push(modifier);
      }
    } else {
      newModifiers = newModifiers.filter(m => m !== modifier);
    }

    setTempShortcut({
      ...tempShortcut,
      modifiers: newModifiers
    });
  };

  const formatShortcutDisplay = (shortcut: ShortcutKey): string => {
    const modifierSymbols = shortcut.modifiers.map(mod => {
      const modifierKey = MODIFIER_KEYS.find(m => m.value === mod);
      return modifierKey ? modifierKey.symbol : mod;
    });
    return [...modifierSymbols, shortcut.key.toUpperCase()].join(' + ');
  };

  if (isEditing) {
    return (
      <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">{i18n.t('shortcut.edit_shortcut')}</Label>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleCancel}>
              {i18n.t('shortcut.cancel')}
            </Button>
            <Button size="sm" onClick={handleSave}>
              {i18n.t('shortcut.save')}
            </Button>
          </div>
        </div>

        {tempShortcut && (
          <>
            <div>
              <Label className="text-xs text-muted-foreground">{i18n.t('shortcut.modifiers')}</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {MODIFIER_KEYS.map(mod => (
                  <label key={mod.value} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tempShortcut.modifiers.includes(mod.value)}
                      onChange={(e) => updateModifier(mod.value, e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">{mod.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">{i18n.t('shortcut.main_key')}</Label>
              <select
                value={tempShortcut.key}
                onChange={(e) => setTempShortcut({ ...tempShortcut, key: e.target.value })}
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {SHORTCUT_KEYS.map(key => (
                  <option key={key} value={key}>{key.toUpperCase()}</option>
                ))}
              </select>
            </div>

            <div className="p-3 bg-background rounded border">
              <Label className="text-xs text-muted-foreground">{i18n.t('shortcut.preview')}</Label>
              <div className="mt-1">
                <Badge variant="secondary" className="font-mono">
                  {formatShortcutDisplay(tempShortcut)}
                </Badge>
              </div>
            </div>

            {conflicts.length > 0 && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded">
                <p className="text-sm text-destructive">
                  {i18n.t('shortcut.conflict_warning', [conflicts.join(', ')])}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {site.shortcuts ? (
          <>
            <Badge 
              variant={site.shortcuts.enabled ? "default" : "secondary"}
              className="font-mono"
            >
              {formatShortcutDisplay(site.shortcuts)}
            </Badge>
            <Switch
              checked={site.shortcuts.enabled}
              onCheckedChange={handleToggleEnabled}
            />
          </>
        ) : (
          <span className="text-sm text-muted-foreground">{i18n.t('shortcut.no_shortcut')}</span>
        )}
      </div>
      
      <div className="flex gap-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={handleStartEdit}
          title={site.shortcuts ? i18n.t('shortcut.edit_shortcut') : i18n.t('shortcut.set_shortcut')}
        >
          {site.shortcuts ? <Edit className="w-3 h-3" /> : <Keyboard className="w-3 h-3" />}
        </Button>
        {site.shortcuts && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleRemove}
            title={i18n.t('shortcut.remove_shortcut')}
            className="text-destructive hover:text-destructive"
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>
    </div>
  );
}
