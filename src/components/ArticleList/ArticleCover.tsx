type ItemCoverProps = {
  desc: string | null;
};

const blackList = ['https://m.av28.tv'];

const findProp = (desc: string, imgStart: number, imgEnd: number, prop: string) => {
  const search = `${prop}="`;
  const start = desc.indexOf(search, imgStart);

  if (start < 0 || start >= imgEnd) {
    return null;
  }

  const end = desc.indexOf('"', start + search.length);
  const value = desc.substring(start + search.length, end);
  return value;
};

const findDataLink = (desc: string, imgStart: number, imgEnd: number) => {
  const dataLink = findProp(desc, imgStart, imgEnd, 'data-link');

  if (!dataLink) {
    return null;
  }

  if (blackList.includes(dataLink.toLowerCase())) {
    return 'block';
  }

  return 'maybe';
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

      const src = findProp(desc, imgStart, imgEnd, 'src');

      if (src) {
        const dataLink = findDataLink(desc, imgStart, imgEnd);

        if (!dataLink) {
          return <img src={src} decoding="async" loading="lazy" />;
        }
      }

      imgStart = imgEnd;
    }
  }

  return desc;
}
