import React, { useState } from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered'
import ScoreboardIcon from '@mui/icons-material/Scoreboard'
import ChatIcon from '@mui/icons-material/Chat'
import HomeIcon from '@mui/icons-material/Home';

import SoundboardAudioPlayer from '@/app/(game)/[id]/components/soundboard/SoundboardAudioPlayer';
import ProgressTabPanel from '@/app/(game)/[id]/components/sidebar/progress/ProgressTabPanel'
import { useRoleContext } from '@/app/(game)/contexts';

import OrganizerSpeedDial from '../speed-dial/OrganizerSpeedDial';

export default function Sidebar({ lang = 'fr-FR' }) {
    const myRole = useRoleContext()

    const [value, setValue] = useState(0);

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    return (
        <Box className='w-full h-full overflow-y-auto'>
            {/* Audio player and volume slider */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <SoundboardAudioPlayer />
            </Box>

            {/* Sidebar tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs
                    value={value}
                    onChange={handleChange}
                    aria-label="sidebar tabs"
                    //
                    indicatorColor='primary'
                    textColor='inherit'
                    variant='fullWidth'
                // variant='scrollable'
                // scrollButtons='auto'
                >
                    <Tab icon={<FormatListNumberedIcon />} label={PROGRESS_TAB_LABEL[lang]} aria-label='game progress' {...a11yProps(0)} />
                    {/* <Tab icon={<ScoreboardIcon />} label='Scores' aria-label='scoreboard' {...a11yProps(1)} /> */}
                    {/* <Tab icon={<ChatIcon />} label='Chat' aria-label='chat' {...a11yProps(2)} disabled /> */}

                    {/* <Tab label="Item One" {...a11yProps(0)} />
                    <Tab label="Item Two" {...a11yProps(1)} />
                    <Tab label="Item Three" {...a11yProps(2)} /> */}
                </Tabs>
            </Box>
            <CustomTabPanel value={value} index={0}>
                <ProgressTabPanel />
            </CustomTabPanel>
            {/* <CustomTabPanel value={value} index={1}>
                <p>Scoreboard</p>
            </CustomTabPanel> */}

            {myRole === 'organizer' && <OrganizerSpeedDial />}

        </Box>
    );
}

function CustomTabPanel(props) {
    const { children, value, index, ...other } = props;

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
    );
}

function a11yProps(index) {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    };
}

const PROGRESS_TAB_LABEL = {
    'en': "Progress",
    'fr-FR': "Progression"
}