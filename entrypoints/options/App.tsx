import { useState, useEffect } from 'react';
import { ConfigPage } from '@/components/ConfigPage';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Toaster } from '@/components/ui/toaster';
import { Settings, Keyboard, Info, Globe } from 'lucide-react';
import logoImage from '@/assets/logo.png';

function App() {
  const [activeTab, setActiveTab] = useState('general');
  
  useEffect(() => {
    document.title = `${i18n.t('options.title')} - ${i18n.t('extension.name')}`;
  }, []);

  const tabs = [
    {
      id: 'general',
      label: i18n.t('options.tabs.general'),
      icon: <Settings className="w-4 h-4" />
    },
    {
      id: 'sites',
      label: i18n.t('options.tabs.sites'),
      icon: <Globe className="w-4 h-4" />
    },
    {
      id: 'shortcuts',
      label: i18n.t('options.tabs.shortcuts'),
      icon: <Keyboard className="w-4 h-4" />
    },
    {
      id: 'about',
      label: i18n.t('options.tabs.about'),
      icon: <Info className="w-4 h-4" />
    }
  ];

  return (
    <div className="min-h-screen bg-background min-w-[800px]">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 border-r bg-card h-screen sticky top-0">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <img src={logoImage} alt="Logo" className="w-8 h-8" />
              <div>
                <h1 className="text-lg">{i18n.t('extension.name')}</h1>
                <p className="text-sm text-muted-foreground">{i18n.t('extension.description')}</p>
              </div>
            </div>
            
            <Separator className="mb-4" />
            
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? 'default' : 'ghost'}
                  className="w-full justify-start gap-3"
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.icon}
                  {tab.label}
                </Button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-8 max-w-4xl">
            <ConfigPage activeTab={activeTab} onTabChange={setActiveTab} />
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  );
}

export default App;
