import { appWindow } from '@tauri-apps/api/window';
import { useEffect } from 'react';

import { ListIcon, PlusIcon } from 'lucide-react';
import AddSeedDialog from './components/AddSeedDialog';
import { Button } from './components/ui/button';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from './components/ui/resizable';
import { ScrollArea } from './components/ui/scroll-area';
import { ToggleGroup, ToggleGroupItem } from './components/ui/toggle-group';
import './globals.css';
import useSeeds from './lib/useSeeds';

function App() {
  const [seeds] = useSeeds();

  useEffect(() => {
    appWindow.show();
  }, []);

  return (
    <ResizablePanelGroup direction="horizontal" autoSaveId="root">
      <ResizablePanel defaultSize={20} minSize={10}>
        <ScrollArea className="p-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Seeds</span>
            <AddSeedDialog>
              <Button variant="ghost" size="icon">
                <PlusIcon />
              </Button>
            </AddSeedDialog>
          </div>
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
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel minSize={50}>Main</ResizablePanel>
    </ResizablePanelGroup>
  );
}

export default App;
