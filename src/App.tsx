import { appWindow } from '@tauri-apps/api/window';
import { EyeIcon, PlusIcon, SearchIcon, SettingsIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useDebounceValue, useLocalStorage } from 'usehooks-ts';

import AddSeedDialog from '@/components/AddSeedDialog';
import ArticleList from '@/components/ArticleList';
import SeedToggleItem from '@/components/SeedToggleItem';
import SettingsDialog from '@/components/SettingsDialog';
import WatchListDialog from '@/components/WatchListDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Toggle } from '@/components/ui/toggle';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import '@/globals.css';
import { dbReadAll } from '@/lib/bindings';
import useSeeds from '@/lib/useSeeds';

function App() {
  const [seedId, setSeedId] = useState(0);
  const [search, setSearch] = useDebounceValue('', 500);
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
          <div className="relative flex-1">
            <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-10"
              type="search"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search"
            />
          </div>
        </div>
        <ScrollArea className="w-full @container">
          <ArticleList seedId={seedId === 0 ? null : seedId} search={search} />
        </ScrollArea>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

export default App;
