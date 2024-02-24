import { useGameContext } from '@/app/(game)/contexts'

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore'
import { doc } from 'firebase/firestore'
import { useParams } from 'next/navigation'
import { useDocumentDataOnce } from 'react-firebase-hooks/firestore'

/**
 * To display when I am an organizer but not the manager of the current question (or theme)
 */
export default function QuestionManagerAnnouncement({ managerId }) {
    const { id: gameId } = useParams()

    const game = useGameContext()

    const [manager, managerLoading, managerError] = useDocumentDataOnce(doc(GAMES_COLLECTION_REF, gameId, 'organizers', managerId))
    if (managerError) {
        return <p><strong>Error: </strong>{JSON.stringify(managerError)}</p>
    }
    if (managerLoading) {
        return <p>Loading manager...</p>
    }
    if (!manager) {
        return <></>
    }

    return <p className='text-3xl'><strong>{manager.name}</strong> manages this question</p>
}