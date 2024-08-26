import FinaleHomeThemes from './FinaleHomeThemes'
import { RoundTypeIcon, ROUND_HEADER_TEXT } from '@/lib/utils/round'
import { DEFAULT_LOCALE } from '@/lib/utils/locales'

export default function FinaleHomeMiddlePane({ round }) {

    return (
        <div className='flex flex-col h-full w-full items-center justify-center'>
            <div className='flex h-[10%] w-full items-center justify-center'>
                <FinaleRoundHeader round={round} />
            </div>

            <div className='flex h-[90%] w-full items-center justify-center'>
                <FinaleHomeThemes round={round} />
            </div>
        </div>
    )
}

function FinaleRoundHeader({ round, lang = DEFAULT_LOCALE }) {
    return (
        <div className='flex flex-row items-center justify-center space-x-1'>
            <RoundTypeIcon roundType={round.type} fontSize={50} />
            <h1 className='2xl:text-5xl'><span className='font-bold'>{ROUND_HEADER_TEXT[lang]} {round.order + 1}</span>: <i>{round.title}</i> </h1>
        </div>
    )
}