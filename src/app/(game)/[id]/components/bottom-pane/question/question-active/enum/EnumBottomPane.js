import EnumController from './EnumController'
import EnumPlayers from './EnumPlayers'

export default function EnumBottomPane({ question }) {

    return (
        <div className='flex flex-row h-full divide-x divide-solid'>

            {/* Left part: controller */}
            <div className='basis-4/5 max-h-full overflow-auto'>
                <EnumController question={question} />
            </div>

            {/* Right part: list of bets */}
            <div className='basis-1/5 max-h-full overflow-auto'>
                <EnumPlayers />
            </div>
        </div>
    )
}
