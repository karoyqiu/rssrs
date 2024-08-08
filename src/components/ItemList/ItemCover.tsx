type ItemCoverProps = {
  desc: string | null;
};

export default function ItemCover(props: ItemCoverProps) {
  const { desc } = props;

  if (!desc) {
    return null;
  }

  const img = desc.indexOf('<img ');

  if (img >= 0) {
    const srcStart = desc.indexOf('src="', img);

    if (srcStart >= 0) {
      const srcEnd = desc.indexOf('"', srcStart + 5);

      if (srcEnd >= 0) {
        const src = desc.substring(srcStart + 5, srcEnd);
        return (
          <img
            src={src}
            crossOrigin="anonymous"
            decoding="async"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        );
      }
    }
  }

  return desc;
}
