type ItemCoverProps = {
  desc: string | null;
};

export default function ItemCover(props: ItemCoverProps) {
  const { desc } = props;

  if (!desc) {
    return null;
  }

  let imgStart = 0;

  while (imgStart >= 0) {
    imgStart = desc.indexOf('<img ', imgStart);

    if (imgStart >= 0) {
      const imgEnd = desc.indexOf('>', imgStart);

      // 将带 data-link 的视为广告
      const dataLink = desc.indexOf('data-link', imgStart);

      const srcStart = desc.indexOf('src="', imgStart);

      if (srcStart >= 0) {
        const srcEnd = desc.indexOf('"', srcStart + 5);

        if (srcEnd >= 0) {
          const src = desc.substring(srcStart + 5, srcEnd);

          if (dataLink < 0 || dataLink > imgEnd || !src.endsWith('.gif')) {
            return <img src={src} decoding="async" loading="lazy" />;
          }
        }
      }

      imgStart = imgEnd;
    }
  }

  return desc;
}
