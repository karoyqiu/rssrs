import type { ReactNode } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProxySettingsCard from './ProxySettingsCard';
import WatchListCard from './WatchListCard';

type SettingsDialogProps = {
  children: ReactNode;
};

export default function SettingsDialog(props: SettingsDialogProps) {
  const { children } = props;

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="h-[40rem] grid-rows-[auto_1fr]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Change the settings of the application.</DialogDescription>
        </DialogHeader>
        <Tabs className="flex w-full grow flex-col" defaultValue="proxy">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="proxy">Proxy</TabsTrigger>
            <TabsTrigger value="watchlist">Watch list</TabsTrigger>
          </TabsList>
          <TabsContent className="grow" value="proxy">
            <ProxySettingsCard />
          </TabsContent>
          <TabsContent className="grow" value="watchlist">
            <WatchListCard />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
