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

import GenericSettingsCard from './GenericSettingsCard';
import ProxySettingsCard from './ProxySettingsCard';

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
            <TabsTrigger value="generic">Generic</TabsTrigger>
            <TabsTrigger value="proxy">Proxy</TabsTrigger>
          </TabsList>
          <TabsContent className="grow" value="generic">
            <GenericSettingsCard />
          </TabsContent>
          <TabsContent className="grow" value="proxy">
            <ProxySettingsCard />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
