import { appWindow } from '@tauri-apps/api/window';
import { PlusIcon, SettingsIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';

import AddSeedDialog from '@/components/AddSeedDialog';
import ItemList from '@/components/ItemList';
import SeedToggleItem from '@/components/SeedToggleItem';
import SettingsDialog from '@/components/SettingsDialog';
import { Button } from '@/components/ui/button';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Toggle } from '@/components/ui/toggle';
import { ToggleGroup } from '@/components/ui/toggle-group';
import useSeeds from '@/lib/useSeeds';

import '@/globals.css';

function App() {
  const [seedId, setSeedId] = useState('*');
  const [autoRead, setAutoRead] = useLocalStorage('autoRead', true);
  const { seeds } = useSeeds();

  useEffect(() => {
    appWindow.show();
  }, []);

  return (
    <ResizablePanelGroup direction="horizontal" autoSaveId="root">
      <ResizablePanel defaultSize={20} minSize={10}>
        <div className="flex h-full flex-col gap-2 p-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Seeds</span>
            <AddSeedDialog>
              <Button variant="ghost" size="icon">
                <PlusIcon />
              </Button>
            </AddSeedDialog>
          </div>
          <ScrollArea className="grow">
            <ToggleGroup
              className="mt-2"
              type="single"
              orientation="vertical"
              value={seedId}
              onValueChange={setSeedId}
            >
              <SeedToggleItem seed={null} />
              {seeds.map((seed) => (
                <SeedToggleItem key={seed.id} seed={seed} />
              ))}
            </ToggleGroup>
          </ScrollArea>
          <SettingsDialog>
            <Button>
              <SettingsIcon />
              Settings
            </Button>
          </SettingsDialog>
        </div>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel minSize={50} className="flex flex-col">
        <div className="flex gap-2 border-b p-1">
          <Toggle pressed={autoRead} onPressedChange={setAutoRead}>
            Auto read
          </Toggle>
        </div>
        <ScrollArea className="w-full @container">
          <ItemList seedId={seedId === '*' ? null : seedId} />
        </ScrollArea>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

export default App;
