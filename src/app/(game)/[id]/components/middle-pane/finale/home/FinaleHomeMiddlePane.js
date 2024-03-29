import { RoundTypeIcon } from '@/lib/utils/question_types'
import FinaleHomeThemes from './FinaleHomeThemes'
import { ROUND_HEADER_TEXT } from '@/lib/utils/round'

export default function FinaleHomeMiddlePane({ round }) {

    console.log(round)

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

function FinaleRoundHeader({ round, lang = 'en' }) {
    return (
        <div className='flex flex-row items-center justify-center space-x-1'>
            <RoundTypeIcon roundType={round.type} fontSize={50} />
            <h1 className='text-5xl'><span className='font-bold'>{ROUND_HEADER_TEXT[lang]} {round.order + 1}</span>: {round.title} </h1>
        </div>
    )
}