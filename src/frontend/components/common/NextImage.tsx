import Image from 'next/image';

interface NextImageProps {
  url: string;
  alt: string;
  height?: string | number;
}

export default function NextImage({ url, alt, height = '100%' }: NextImageProps) {
  return <Image src={url} alt={alt} width={0} height={0} style={{ width: 'auto', height: height }} />;
}
