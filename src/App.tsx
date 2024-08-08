import { appWindow } from '@tauri-apps/api/window';
import { ListIcon, PlusIcon, SettingsIcon } from 'lucide-react';
import { useEffect } from 'react';

import AddSeedDialog from '@/components/AddSeedDialog';
import SettingsDialog from '@/components/SettingsDialog';
import { Button } from '@/components/ui/button';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import useSeeds from '@/lib/useSeeds';

import '@/globals.css';
import ItemList from './components/ItemList';

function App() {
  const [seeds] = useSeeds();

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
              <ToggleGroupItem className="justify-start" value="*">
                <ListIcon />
                All
              </ToggleGroupItem>
              {seeds.map((seed) => (
                <ToggleGroupItem className="justify-start" key={seed.id} value={seed.id.toString()}>
                  {seed.name}
                </ToggleGroupItem>
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
        <ScrollArea className="@container h-full w-full">
          <ItemList />
        </ScrollArea>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

export default App;
