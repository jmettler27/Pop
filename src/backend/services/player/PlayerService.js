import PlayerRepository from "@/backend/repositories/user/PlayerRepository";


import { firestore } from '@/backend/firebase/firebase'
import {
    doc,
    runTransaction
} from 'firebase/firestore'
import { GAMES_COLLECTION_REF } from '@/backend/firebase/firestore';

import { getDocDataTransaction } from '@/backend/services/utils';

import { Timer } from '@/backend/models/Timer';
import { PlayerStatus } from '@/backend/models/users/Player';
import { TimerStatus } from '@/backend/models/Timer';

import TimerRepository from "@/backend/repositories/timer/TimerRepository";
import SoundRepository from "@/backend/repositories/sound/SoundRepository";


export default class PlayerService {

    constructor(gameId) {
        if (!gameId) {
            throw new Error("Game ID is required");
        }

        this.gameId = gameId;
        this.playerRepo = new PlayerRepository(this.gameId);
        this.timerRepo = new TimerRepository(this.gameId);
        this.soundRepo = new SoundRepository(this.gameId);
    }

    async setPlayerReady(playerId) {
        if (!playerId) {
            throw new Error("Player ID is required");
        }

        try {
            await runTransaction(firestore, async (transaction) => {
                const readyRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'ready')
                const readyData = await getDocDataTransaction(transaction, readyRef)
                const { numReady, numPlayers } = readyData
                const newNumReady = numReady + 1
            
                await this.playerRepo.updatePlayerStatusTransaction(transaction, playerId, PlayerStatus.READY)
            
                transaction.update(readyRef, {
                    numReady: newNumReady
                })
            
                const num = Math.floor(Math.random() * 50)
                await this.soundRepo.addSoundTransaction(transaction, num === 0 ? 'fart_perfecter' : 'pop')
            
                if (newNumReady === numPlayers) {
                    await this.timerRepo.updateTimerTransaction(transaction, {
                        status: TimerStatus.START,
                        duration: Timer.READY_COUNTDOWN_SECONDS,
                        forward: false
                    })
                    await this.togglePlayerAuthorizationTransaction(transaction, false)
                }
            });
        }
        catch (error) {
            console.error("There was an error setting the player ready", error);
            throw error;
        }
    }

    async togglePlayerAuthorization(authorized = null) {
    
        try {
            await runTransaction(firestore, transaction =>
                this.togglePlayerAuthorizationTransaction(transaction, authorized)
            )
        }
        catch (error) {
            console.error("There was an error authorizing the players:", error);
            throw error;
        }
    }
    
    async togglePlayerAuthorizationTransaction(
        transaction,
        authorized = null
    ) {

        let newVal = authorized
        if (authorized === null) {
            const timer = await this.timerRepo.getTimerTransaction(transaction)
            newVal = !timer.authorized
        }
        await this.timerRepo.updateTimerTransaction(transaction, { authorized: newVal })
        if (newVal === true)
            await this.soundRepo.addSoundTransaction(transaction, 'minecraft_button_plate')

        console.log("Toggled player authorization", newVal)
    }

}
