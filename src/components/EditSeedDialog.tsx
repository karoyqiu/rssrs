import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { SaveIcon, TrashIcon } from 'lucide-react';
import { createCallable } from 'react-call';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { type Seed, commands } from '@/lib/bindings';

import { type AddSeedType, addSeedSchema } from './AddSeedDialog';

type EditSeedDialogProps = {
  seed: Pick<Seed, 'id' | 'name' | 'url'>;
};

const EditSeedDialog = createCallable<EditSeedDialogProps>(({ seed, call }) => {
  const form = useForm<AddSeedType>({
    resolver: standardSchemaResolver(addSeedSchema),
    defaultValues: seed,
  });

  return (
    <Dialog defaultOpen>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit seed</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            className="flex flex-col gap-2"
            autoComplete="off"
            onSubmit={form.handleSubmit(async (values) => {
              const { name, url } = values;
              const result = await commands.dbUpdateSeed(seed.id, name, url);

              if (result) {
                call.end();
              } else {
                toast.error('Failed to save seed.');
              }
            })}
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input required {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL</FormLabel>
                  <FormControl>
                    <Input required type="url" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="mt-2 flex">
              <Button
                type="button"
                variant="destructive"
                onClick={async () => {
                  const result = await commands.dbDeleteSeed(seed.id);

                  if (result) {
                    call.end();
                  } else {
                    toast.error('Failed to delete seed.');
                  }
                }}
              >
                <TrashIcon />
                Delete
              </Button>
              <Button className="ml-auto" type="submit">
                <SaveIcon />
                Save
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
});

export default EditSeedDialog;
