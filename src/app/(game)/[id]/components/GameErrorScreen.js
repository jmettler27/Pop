import { Button, IconButton } from '@mui/material'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import HomeIcon from '@mui/icons-material/Home';

export default function GameErrorScreen() {
    return (
        <div className='flex flex-col h-screen items-center justify-center'>
            <h1 className='2xl:text-3xl'>Oh no! There is no place left for you... 😞</h1>


            <Button
                color='primary'
                variant='contained'
                className='mt-4'
                startIcon={<HomeIcon />}
            >
                <Link href='/'>
                    Go back home
                </Link>
            </Button>
        </div>
    )
}