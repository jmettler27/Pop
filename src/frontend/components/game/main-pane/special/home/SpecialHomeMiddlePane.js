import { RoundTypeIcon } from '@/backend/utils/rounds';
import globalMessages from '@/i18n/globalMessages';

import { useIntl } from 'react-intl';

import SpecialHomeThemes from '@/frontend/components/game/main-pane/special/home/SpecialHomeThemes';

export default function SpecialHomeMiddlePane({ round }) {
  return (
    <div className="flex flex-col h-full w-full items-center justify-center">
      <div className="flex h-[10%] w-full items-center justify-center">
        <SpecialRoundHeader round={round} />
      </div>

      <div className="flex h-[90%] w-full items-center justify-center">
        <SpecialHomeThemes round={round} />
      </div>
    </div>
  );
}

function SpecialRoundHeader({ round }) {
  const intl = useIntl();
  return (
    <div className="flex flex-row items-center justify-center space-x-1">
      <RoundTypeIcon roundType={round.type} fontSize={50} />
      <h1 className="2xl:text-5xl">
        <span className="font-bold">
          {intl.formatMessage(globalMessages.round)} {round.order + 1}
        </span>
        : <i>{round.title}</i>{' '}
      </h1>
    </div>
  );
}
