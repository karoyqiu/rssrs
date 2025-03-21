import { useRef } from 'react';
import { useEventListener } from 'usehooks-ts';

import { download } from '@/lib/bindings';

const blackList = ['https://m.av28.tv'];

type ArticleCoverProps = {
  desc: string | null;
  link: string | null;
};

export default function ArticleCover(props: ArticleCoverProps) {
  const { desc, link } = props;
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
    return null;
  }

  try {
    const dom = new DOMParser();
    const doc = dom.parseFromString(desc, 'text/html');

    for (const img of doc.querySelectorAll('img')) {
      if (img.src) {
        const link = img.dataset.link?.toLowerCase();

        if (!link || !blackList.includes(link)) {
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

    return doc.documentElement.innerText;
  } catch (e) {}

  return desc;
}
