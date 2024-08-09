import { appWindow } from '@tauri-apps/api/window';
import { PlusIcon, SettingsIcon } from 'lucide-react';
import { useEffect } from 'react';

import AddSeedDialog from '@/components/AddSeedDialog';
import ItemList from '@/components/ItemList';
import SeedToggleItem from '@/components/SeedToggleItem';
import SettingsDialog from '@/components/SettingsDialog';
import { Button } from '@/components/ui/button';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ToggleGroup } from '@/components/ui/toggle-group';
import useSeeds from '@/lib/useSeeds';

import '@/globals.css';

function App() {
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
            <ToggleGroup className="mt-2" type="single" orientation="vertical">
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
      <ResizablePanel minSize={50}>
        <ScrollArea className="h-full w-full @container">
          <ItemList />
        </ScrollArea>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

export default App;
