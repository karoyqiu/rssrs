import { appWindow } from '@tauri-apps/api/window';
import { EyeIcon, PlusIcon, SettingsIcon } from 'lucide-react';
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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import WatchListDialog from '@/components/WatchListDialog';
import { dbReadAll } from '@/lib/bindings';
import useSeeds from '@/lib/useSeeds';

import '@/globals.css';

function App() {
  const [seedId, setSeedId] = useState(0);
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
            <span className="ps-2 text-sm text-muted-foreground">Seeds</span>
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
              value={seedId.toString()}
              onValueChange={(value) => {
                if (value.length > 0) {
                  setSeedId(parseInt(value, 10));
                }
              }}
            >
              <ToggleGroupItem className="justify-start" value="-1">
                <EyeIcon />
                Watch list
                <WatchListDialog>
                  <SettingsIcon className="ms-auto hover:text-primary" />
                </WatchListDialog>
              </ToggleGroupItem>
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
        <div className="flex gap-1 border-b p-1">
          <Toggle pressed={autoRead} onPressedChange={setAutoRead}>
            Auto read
          </Toggle>
          <Button disabled={seedId < 0} onClick={() => dbReadAll(seedId)}>
            Read all
          </Button>
        </div>
        <ScrollArea className="w-full @container">
          <ItemList seedId={seedId === 0 ? null : seedId} />
        </ScrollArea>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

export default App;
