import twemoji from 'twemoji';

type Props = { emoji: string; className?: string };

// twemoji's default maxcdn base URL was discontinued; use jsdelivr instead
const TWEMOJI_BASE = 'https://cdn.jsdelivr.net/npm/twemoji@14.0.2/assets/';

export function Emoji({ emoji, className }: Props) {
  const html = twemoji.parse(emoji, { folder: 'svg', ext: '.svg', base: TWEMOJI_BASE });
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
