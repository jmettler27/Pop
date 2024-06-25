import { useState, useEffect } from 'react'

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore'
import { doc } from 'firebase/firestore'
import { useDocument } from 'react-firebase-hooks/firestore'

import { Tabs, Tab, Box, CircularProgress } from '@mui/material'

import GlobalProgressTabPanel from './GlobalProgressTabPanel'
import RoundProgressTabPanel from './round/RoundProgressTabPanel'
import { ROUND_HEADER_TEXT } from '@/lib/utils/round'
import { GAME_HEADER_TEXT } from '@/lib/utils/game'

import { useParams } from 'next/navigation'
import { DEFAULT_LOCALE } from '@/lib/utils/locales'

export default function ProgressTabPanel({ }) {
    const { id: gameId } = useParams()

    const gameDocRef = doc(GAMES_COLLECTION_REF, gameId)
    const [gameDoc, gameDocLoading, gameDocError] = useDocument(gameDocRef)
    if (gameDocError) {
        return <p><strong>Error: {JSON.stringify(gameDocError)}</strong></p>
    }
    if (gameDocLoading) {
        return <CircularProgress />
    }
    if (!gameDoc) {
        return <></>
    }
    const game = { id: gameDoc.id, ...gameDoc.data() }

    return <ProgressTabPanelMainContent game={game} />
}

function ProgressTabPanelMainContent({ game, lang = DEFAULT_LOCALE }) {
    const [value, setValue] = useState(0)

    useEffect(() => {
        if (!game.currentRound || game.status === 'game_home') {
            setValue(0)
            return
        }
        setValue(1)
    }, [game.status, game.currentRound])

    const handleChange = (event, newValue) => {
        setValue(newValue)
    }

    return (
        <Box className='w-full'>
            {/* Sidebar tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs
                    value={value}
                    onChange={handleChange}
                    aria-label="sidebar tabs"
                    //
                    indicatorColor='secondary'
                    textColor='inherit'
                    variant='fullWidth'
                >
                    <Tab label={GAME_HEADER_TEXT[lang]} aria-label='game progress' {...a11yProps(0)} />
                    {/* {(game.type === 'rounds' && game.currentRound) && ( */}
                    <Tab label={ROUND_HEADER_TEXT[lang]} aria-label='round progress' {...a11yProps(1)} />
                    {/* )} */}
                </Tabs>
            </Box>

            {(game.status !== 'game_start') && (
                <CustomTabPanel value={value} index={0}>
                    <GlobalProgressTabPanel game={game} />
                </CustomTabPanel>
            )}

            {(game.type === 'rounds' && game.currentRound && (game.status === 'round_start' || game.status === 'round_end' || game.status === 'question_active' || game.status === 'question_end' || game.status === 'finale')) && (
                <CustomTabPanel value={value} index={1}>
                    <RoundProgressTabPanel game={game} />
                </CustomTabPanel>
            )}

        </Box>
    )
}

function CustomTabPanel(props) {
    const { children, value, index, ...other } = props

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box>
                    {/* sx={{ p: 3 }} */}
                    {children}
                </Box>
            )}
        </div>
    )
}

function a11yProps(index) {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    }
}



