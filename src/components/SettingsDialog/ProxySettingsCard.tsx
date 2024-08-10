import { zodResolver } from '@hookform/resolvers/zod';
import { SaveIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import useSetting from '@/lib/useSettings';
import { useEffect } from 'react';

const proxySchema = z
  .object({
    type: z.enum(['none', 'sys', 'http']),
    host: z.string(),
    port: z.coerce.number().int().min(0).max(65535),
  })
  .refine(
    (arg) => arg.type !== 'http' || (arg.host.length > 0 && arg.port > 0),
    (arg) => {
      if (arg.host.length === 0) {
        return {
          message: 'Hostname must not be empty.',
          path: ['host'],
        };
      }

      return {
        message: 'Port must not be zero.',
        path: ['port'],
      };
    },
  );

export type ProxySettings = z.infer<typeof proxySchema>;

const defaultProxySettings = Object.freeze<ProxySettings>({
  type: 'sys',
  host: '127.0.0.1',
  port: 8080,
});

export default function ProxySettingsCard() {
  const [proxy, save] = useSetting('proxy', defaultProxySettings);
  const form = useForm<ProxySettings>({
    resolver: zodResolver(proxySchema),
    defaultValues: proxy,
  });
  const values = form.watch();

  useEffect(() => {
    form.reset(proxy);
  }, [proxy]);

  return (
    <Form {...form}>
      <form
        className="h-full"
        onSubmit={form.handleSubmit(async (values) => {
          const ok = await save(values);

          if (ok) {
            toast.success('Proxy settings saved.');
          } else {
            toast.error('Failed to save proxy settings.');
          }
        })}
      >
        <Card className="flex h-full flex-col">
          <CardHeader>
            <CardTitle>Proxy</CardTitle>
            <CardDescription>Use a proxy to access the internet.</CardDescription>
          </CardHeader>
          <CardContent className="flex grow flex-col gap-2">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <RadioGroup value={field.value} onValueChange={field.onChange}>
                      <FormItem className="flex items-center gap-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem className="peer" value="none" />
                        </FormControl>
                        <FormLabel>Do not use proxy</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center gap-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem className="peer" value="sys" />
                        </FormControl>
                        <FormLabel>Use system proxy</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center gap-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem className="peer" value="http" />
                        </FormControl>
                        <FormLabel>Use the proxy blow</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex w-full flex-col gap-2 pl-6">
              <FormField
                control={form.control}
                name="host"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hostname</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={values.type !== 'http'} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="port"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Port</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={values.type !== 'http'}
                        type="number"
                        min={0}
                        max={65535}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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
