import { Home } from 'lucide-react';
import { useIntl } from 'react-intl';

import { Button } from '@/components/ui/button';
import defineMessages from '@/i18n/defineMessages';

const messages = defineMessages('frontend.game.bottom.GoGameHomeButton', {
  goHome: 'Go to Home',
});

interface GoGameHomeButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export default function GoGameHomeButton({ onClick, disabled }: GoGameHomeButtonProps) {
  const intl = useIntl();
  return (
    <Button size="lg" onClick={onClick} disabled={disabled}>
      <Home className="mr-2 size-4" />
      {intl.formatMessage(messages.goHome)}
    </Button>
  );
}
