import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { PlusIcon, SaveIcon, TrashIcon } from 'lucide-react';
import { createCallable } from 'react-call';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod/v4-mini';

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

const seedSchema = z.object({
  name: z.string(),
  url: z.url(),
});
type seedType = z.infer<typeof seedSchema>;

type SeedDialogProps = {
  seed?: Pick<Seed, 'id' | 'name' | 'url'>;
};

const SeedDialog = createCallable<SeedDialogProps>(({ seed, call }) => {
  const form = useForm<seedType>({
    resolver: standardSchemaResolver(seedSchema),
    defaultValues: seed ?? {
      name: '',
      url: '',
    },
  });

  return (
    <Dialog defaultOpen>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{seed ? 'Edit seed' : 'Add seed'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            className="flex flex-col gap-4"
            autoComplete="off"
            onSubmit={form.handleSubmit(async (values) => {
              const { name, url } = values;
              const command = seed
                ? commands.dbUpdateSeed(seed.id, name, url)
                : commands.dbInsertSeed(name, url);
              const result = await command;

              if (result) {
                call.end();
              } else {
                toast.error(seed ? 'Failed to save seed.' : 'Failed to add seed.');
              }
            })}
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="required">Name</FormLabel>
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
                  <FormLabel className="required">URL</FormLabel>
                  <FormControl>
                    <Input required type="url" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="mt-2 flex">
              {seed ? (
                <>
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
                </>
              ) : (
                <Button className="ml-auto" type="submit">
                  <PlusIcon />
                  Add
                </Button>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
});

export default SeedDialog;
