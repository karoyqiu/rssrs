import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { SaveIcon } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod/v4-mini';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import useSettings from '@/lib/useSettings';

const genericSchema = z.object({
  timeout: z.coerce.number().check(z.int(), z.minimum(0)),
  ads: z.string(),
});

export type GenericSettings = z.infer<typeof genericSchema>;

export const defaultGenericSettings = Object.freeze<GenericSettings>({
  timeout: 30,
  ads: '/ads/',
});

export default function GenericSettingsCard() {
  const [generic, save] = useSettings('generic', defaultGenericSettings);
  const form = useForm<GenericSettings>({
    resolver: standardSchemaResolver(genericSchema),
    defaultValues: generic,
  });

  useEffect(() => {
    form.reset(generic);
  }, [generic]);

  return (
    <Form {...form}>
      <form
        className="h-full"
        onSubmit={form.handleSubmit(async (values) => {
          const ok = await save(values);

          if (ok) {
            toast.success('Generic settings saved.');
          } else {
            toast.error('Failed to save generic settings.');
          }
        })}
      >
        <Card className="flex h-full flex-col">
          <CardHeader>
            <CardTitle>Generic</CardTitle>
            <CardDescription>Generic settings for the application.</CardDescription>
          </CardHeader>
          <CardContent className="flex grow flex-col gap-2">
            <FormField
              control={form.control}
              name="timeout"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Timeout (in seconds)</FormLabel>
                  <FormControl>
                    <Input {...field} required type="number" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ads"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ads patterns</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormDescription>Input one ads regexp pattern per line.</FormDescription>
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex flex-row-reverse">
            <Button type="submit">
              <SaveIcon />
              Save
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
