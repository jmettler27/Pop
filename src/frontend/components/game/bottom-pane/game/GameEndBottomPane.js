import { useIntl } from 'react-intl';
import defineMessages from '@/utils/defineMessages';

const messages = defineMessages('frontend.game.bottom.GameEndBottomPane', {
  congratulations: 'Congratulations to all!',
});

export default function GameEndBottomPane() {
  const intl = useIntl();

  return (
    <div className="flex flex-col h-full justify-around items-center">
      <span className="2xl:text-4xl font-bold">{intl.formatMessage(messages.congratulations)} 👏</span>
    </div>
  );
}
