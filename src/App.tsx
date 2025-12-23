import { DragDropProvider } from '@dnd-kit/react';
import { isSortable } from '@dnd-kit/react/sortable';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { EyeIcon, PlusIcon, SearchIcon, SettingsIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useDefaultLayout } from 'react-resizable-panels';
import { useDebounceValue, useLocalStorage } from 'usehooks-ts';

import ArticleList from '@/components/ArticleList';
import SeedDialog from '@/components/SeedDialog';
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
import { commands } from '@/lib/bindings';
import useSeeds from '@/lib/useSeeds';

const appWindow = getCurrentWebviewWindow();

function App() {
  const [seedId, setSeedId] = useState(0);
  const [search, setSearch] = useDebounceValue('', 500);
  const [autoRead, setAutoRead] = useLocalStorage('autoRead', true);
  const [unreadOnly, setUnreadOnly] = useLocalStorage('unreadOnly', true);
  const { seeds, reorder } = useSeeds();

  const { defaultLayout, onLayoutChange } = useDefaultLayout({
    id: 'root',
    storage: localStorage,
  });

  useEffect(() => {
    appWindow.show();
  }, []);

  return (
    <ResizablePanelGroup
      orientation="horizontal"
      defaultLayout={defaultLayout}
      onLayoutChange={onLayoutChange}
    >
      <ResizablePanel defaultSize={20} minSize={10}>
        <div className="flex h-full flex-col gap-2 p-2">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground ps-2 text-sm">Seeds</span>
            <Button variant="ghost" size="icon" onClick={() => SeedDialog.call({})}>
              <PlusIcon />
            </Button>
          </div>
          <ScrollArea className="grow">
            <ToggleGroup
              className="mt-2"
              type="single"
              orientation="vertical"
              spacing={1}
              value={seedId.toString()}
              onValueChange={(value) => {
                if (value.length > 0) {
                  setSeedId(parseInt(value, 10));
                }
              }}
            >
              <ToggleGroupItem className="justify-start rounded" value="-1">
                <EyeIcon />
                Watch list
                <WatchListDialog>
                  <SettingsIcon className="hover:text-primary ms-auto" />
                </WatchListDialog>
              </ToggleGroupItem>
              <SeedToggleItem seed={null} index={-1} />
              <DragDropProvider
                onDragEnd={({ operation: { source }, canceled }) => {
                  if (!canceled && isSortable(source)) {
                    const fromIndex = source.sortable.initialIndex;
                    const toIndex = source.sortable.index;
                    reorder(fromIndex, toIndex);
                  }
                }}
              >
                {seeds.map((seed, index) => (
                  <SeedToggleItem key={seed.id} seed={seed} index={index} />
                ))}
              </DragDropProvider>
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
        <div className="flex h-full flex-col">
          <div className="flex gap-1 border-b p-1">
            <Toggle pressed={autoRead} onPressedChange={setAutoRead}>
              Auto read
            </Toggle>
            <Toggle pressed={unreadOnly} onPressedChange={setUnreadOnly}>
              Unread only
            </Toggle>
            <Button disabled={seedId < 0} onClick={() => commands.dbReadAll(seedId)}>
              Read all
            </Button>
            <div className="relative flex-1">
              <SearchIcon className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
              <Input
                className="pl-10"
                type="search"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search"
              />
            </div>
          </div>
          <ScrollArea className="@container min-h-0 w-full">
            <ArticleList
              seedId={seedId === 0 ? null : seedId}
              search={search}
              unreadOnly={unreadOnly}
            />
          </ScrollArea>
        </div>
        <SeedDialog.Root />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

export default App;
