import { rankingToEmoji } from '@/backend/utils/emojis';
import { RoundType } from '@/backend/models/rounds/RoundType';

export function RoundRankingPolicy({ round }) {
  switch (round.type) {
    case 'special':
      return <SpecialRoundRankingPolicy round={round} />;
    default:
      return (
        <div className="flex flex-col items-center justify-start space-y-4 p-2">
          <RoundRankingPolicyTitle round={round} />
          <div className="flex flex-col items-center justify-start">
            <p className="2xl:text-2xl">Le barème</p>
            <ol className="2xl:text-2xl border-solid border-yellow-500 border-2 p-2">
              {round.rewards.map((reward, index) => (
                <li key={index}>
                  {rankingToEmoji(index)} {reward} pts
                </li>
              ))}
              {/* <li key={round.rewards.length - 1}>...  0 pts</li> */}
            </ol>
            <br></br>
            <p className="2xl:text-2xl text-center">
              où les équipes sont classées dans l&apos;ordre{' '}
              <strong>
                {round.type === RoundType.ODD_ONE_OUT || round.type === RoundType.MATCHING
                  ? '⚠️ croissant'
                  : 'décroissant'}
              </strong>{' '}
              du nombre de points gagnés.
            </p>
          </div>
        </div>
      );
  }
}

function RoundRankingPolicyTitle({ round }) {
  switch (round.type) {
    case RoundType.PROGRESSIVE_CLUES:
    case RoundType.BASIC:
    case RoundType.BLINDTEST:
    case RoundType.EMOJI:
    case RoundType.ENUMERATION:
    case RoundType.IMAGE:
    case RoundType.NAGUI:
      return <BuzzerRoundRankingPolicyTitle round={round} />;
    case RoundType.LABELLING:
      return <LabelRoundRankingPolicyTitle round={round} />;
    case RoundType.MATCHING:
      return <MatchingRoundRankingPolicyTitle round={round} />;
    case RoundType.MCQ:
      return <MCQRoundRankingPolicyTitle round={round} />;
    case RoundType.ODD_ONE_OUT:
      return <OddOneOutRoundRankingPolicyTitle round={round} />;
    case RoundType.QUOTE:
      return <QuoteRoundRankingPolicyTitle round={round} />;
    default:
      return <></>;
  }
}

function BuzzerRoundRankingPolicyTitle({ round }) {
  return (
    <h1 className="2xl:text-3xl">
      <span className="font-bold">{round.rewardsPerQuestion} point</span> par bonne réponse
    </h1>
  );
}

function QuoteRoundRankingPolicyTitle({ round }) {
  return (
    <h1 className="2xl:text-3xl">
      <span className="font-bold">{round.rewardsPerElement} point</span> par bon élément trouvé
    </h1>
  );
}

function LabelRoundRankingPolicyTitle({ round }) {
  return (
    <h1 className="2xl:text-3xl">
      <span className="font-bold">{round.rewardsPerElement} point</span> par bon élément trouvé
    </h1>
  );
}

function OddOneOutRoundRankingPolicyTitle({ round }) {
  const { mistakePenalty } = round;
  return (
    <h1 className="2xl:text-3xl">
      <span className="font-bold">
        {mistakePenalty} point{Math.abs(mistakePenalty) > 1 ? 's' : ''}
      </span>{' '}
      par intrus trouvé
    </h1>
  );
}

function MatchingRoundRankingPolicyTitle({ round }) {
  const { mistakePenalty } = round;
  return (
    <h1 className="2xl:text-3xl">
      <span className="font-bold">
        {mistakePenalty} point{Math.abs(mistakePenalty) > 1 ? 's' : ''}
      </span>{' '}
      par mauvais lien créé
    </h1>
  );
}

function MCQRoundRankingPolicyTitle({ round }) {
  return (
    <>
      <h1 className="2xl:text-3xl text-center">Un nombre variable de points par bonne réponse</h1>
    </>
  );
}

function SpecialRoundRankingPolicy({ round }) {
  return (
    <div className="flex flex-col items-center justify-start space-y-4">
      <h1 className="2xl:text-3xl text-center">
        😨 Vos <strong>points accumulés</strong> jusqu&apos;à présent = votre{' '}
        <strong>nombre de droits à l&apos;erreur</strong>
      </h1>
      <div className="flex flex-col items-center justify-start">
        <p className="2xl:text-2xl text-center">
          L&apos;ordre de passage ={' '}
          {round.order > 0 ? `Le classement inversé de la manche ${round.order}` : 'Un ordre aléatoire'}.
        </p>
      </div>
    </div>
  );
}
