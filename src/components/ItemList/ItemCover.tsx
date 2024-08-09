type ItemCoverProps = {
  desc: string | null;
};

export default function ItemCover(props: ItemCoverProps) {
  const { desc } = props;

  if (!desc) {
    return null;
  }

  let img = 0;

  while (img >= 0) {
    img = desc.indexOf('<img ', img);

    if (img >= 0) {
      const srcStart = desc.indexOf('src="', img);

      if (srcStart >= 0) {
        const srcEnd = desc.indexOf('"', srcStart + 5);

        if (srcEnd >= 0) {
          const src = desc.substring(srcStart + 5, srcEnd);

          if (src.endsWith('.gif')) {
            img = srcEnd;
          } else {
            return <img src={src} decoding="async" loading="lazy" />;
          }
        }
      }
    }
  }

  return desc;
}
