import { ImageOff } from 'lucide-react';
import { useMemo, useRef } from 'react';
import { useEventListener } from 'usehooks-ts';

import { download } from '@/lib/bindings';
import useSettings from '@/lib/useSettings';

import { defaultGenericSettings } from '../SettingsDialog/GenericSettingsCard';

type ArticleCoverProps = {
  desc: string | null;
  link: string | null;
};

export default function ArticleCover(props: ArticleCoverProps) {
  const { desc, link } = props;
  const [generic] = useSettings('generic', defaultGenericSettings);
  const ads = useMemo(() => generic.ads.split('\n').map((p) => new RegExp(p, 'i')), [generic.ads]);
  let imgRef = useRef<HTMLImageElement>(null);

  useEventListener(
    'error',
    async () => {
      if (imgRef.current) {
        imgRef.current.src = await download(imgRef.current.src, link);
      }
    },
    imgRef,
    { once: true, passive: true },
  );

  if (!desc) {
    return (
      <div className="w-full h-full flex items-center">
        <ImageOff className="text-muted-foreground m-auto" />
      </div>
    );
  }

  try {
    const dom = new DOMParser();
    const doc = dom.parseFromString(desc, 'text/html');

    for (const img of doc.querySelectorAll('img')) {
      if (img.src && !ads.some((ad) => ad.test(img.src))) {
        const link = img.dataset.link?.toLowerCase();

        if (!link || !ads.some((ad) => ad.test(link))) {
          return (
            <img
              ref={imgRef}
              src={img.src}
              decoding="async"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          );
        }
      }
    }

    return <p className="p-2">{doc.documentElement.innerText}</p>;
  } catch (e) {}

  return <p className="p-2">{desc}</p>;
}
