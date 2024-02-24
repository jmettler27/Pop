"use client";

import { redirect } from "next/navigation";
import { useSession, signOut } from "next-auth/react"

import { Avatar, Button } from "@mui/material";
import LogoutIcon from '@mui/icons-material/Logout'

import OngoingGames from "@/app/components/home/OngoingGames";
import { GamesUnderConstruction } from "./components/home/GamesUnderConstruction";

export default function Home() {
    const { data: session } = useSession()

    if (!session || !session.user) {
        redirect("/api/auth/signin");
    }

    const user = session.user

    console.log("My id:", user.id)

    return (
        <div className='flex flex-row h-screen divide-x divide-solid'>
            {/* User sidebar */}
            <UserSidebar user={user} />
            {/* User home */}
            <UserHome user={user} />
        </div>
    )
}

function UserSidebar({ user }) {
    // const user = useUserContext()

    return (
        <div className="flex flex-col w-1/5 divide-y divide-dashed">

            <div className="flex flex-col h-1/5 items-center justify-around">
                <p className="text-2xl text-clip">{user.name}</p>
                <Avatar
                    alt={user.name}
                    src={user.image}
                    sx={{ width: 60, height: 60 }}
                />
                <LogoutButton />
            </div>

            <div className="flex flex-col h-4/5 items-center">
                <p className='text-1xl'>Previous games</p>
                {/* <UserPreviousGames /> */}
            </div>
        </div>
    )
}

function LogoutButton() {
    return (
        <Button
            variant="outlined"
            color="error"
            endIcon={<LogoutIcon />}
            onClick={() => signOut()}
        >
            Logout
        </Button>
    )
}

function UserHome({ user }) {
    return (
        // <div className="flex flex-col w-4/5 items-center justify-around divide-y divide-solid">

        <div className='flex flex-1 flex-col w-4/5 gap-4 p-4 md:gap-8 md:p-6 divide-y divide-solid'>

            {/* Create a new game */}

            {/* Active games */}
            <OngoingGames />

            {/* Games under construction */}
            <GamesUnderConstruction />

        </div>
    )
}

