import { useState } from "react"

import { useParams } from "next/navigation"

import { CardTitle, CardHeader, CardContent, Card } from '@/app/components/card'

import { Button, Dialog, DialogContent, DialogTitle } from "@mui/material"

import { useAsyncAction } from "@/lib/utils/async"
import { GAME_ROUND_DEFAULT_REWARDS, GAME_ROUND_TITLE_MAX_LENGTH } from "@/lib/utils/round"

import { Form, Formik } from "formik"
import * as Yup from 'yup';
import { stringSchema } from '@/lib/utils/forms'
import { typeSchema } from "@/lib/utils/question_types"

import { addGameRound } from '@/app/edit/[id]/lib/edit-game'
import SelectRoundType from "@/app/edit/[id]/components/SelectRoundType"
import { MyNumberInput, MyTextInput } from "@/app/components/forms/StyledFormComponents"
import SubmitFormButton from "@/app/components/forms/SubmitFormButton"

import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

export function AddNewRoundButton({ disabled, lang = 'fr-FR' }) {
    const [dialogOpen, setDialogOpen] = useState(false)

    return (
        <>
            <div className='flex flex-col h-full'>
                <Button className='' size='large' variant='outlined' style={{ border: '2.5px dashed', fontSize: '1rem' }}
                    startIcon={<AddCircleOutlineIcon />}
                    disabled={disabled}
                    onClick={() => setDialogOpen(true)}
                >
                    {ADD_ROUND[lang]}
                </Button>
            </div>
            <AddNewRoundFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} lang={lang} />
        </>
    )
}

const ADD_ROUND = {
    'en': "Add round",
    'fr-FR': "Ajouter manche"
}


function AddNewRoundFormDialog({ open, onClose, lang }) {
    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>{ADD_NEW_ROUND_TITLE[lang]}</DialogTitle>
            <DialogContent>
                <AddNewRoundForm onClose={onClose} lang={lang} />
            </DialogContent>
        </Dialog>
    )
}

const ADD_NEW_ROUND_TITLE = {
    'en': "Create new round",
    'fr-FR': "Créer une nouvelle manche"
}


function AddNewRoundForm({ onClose, lang }) {
    const { id: gameId } = useParams()

    const [submitRound, isSubmitting] = useAsyncAction(async (values) => {
        try {
            const { title, type, rewards, rewardsPerQuestion } = values
            await addGameRound(gameId, title, type, rewards, rewardsPerQuestion)
        } catch (error) {
            console.error("There was an error creating the round:", error)
            throw error
        }
        onClose()
    })

    const validationSchema = Yup.object({
        type: typeSchema(),
        title: stringSchema(GAME_ROUND_TITLE_MAX_LENGTH),
        rewards: Yup.array().of(
            Yup.number()
                .required()
                .integer()
                .min(1)
                .max(10)
        ),
        rewardsPerQuestion: Yup.number()
            .required()
            .integer()
            .min(1)
            .max(10),
    })

    return (
        <Formik
            initialValues={{
                type: '',
                title: '',
                rewards: GAME_ROUND_DEFAULT_REWARDS,
                rewardsPerQuestion: 1
            }}
            onSubmit={async values => await submitRound(values, gameId)}
            validationSchema={validationSchema}
        >
            <Form>
                <SelectRoundType label='Type' name='type' validationSchema={validationSchema} lang={lang} />

                <MyTextInput
                    label={ROUND_TITLE_LABEL[lang]}
                    name='title'
                    type='text'
                    validationSchema={validationSchema}
                    maxLength={GAME_ROUND_TITLE_MAX_LENGTH}
                />

                <MyNumberInput label="Rewards per question" name='rewardsPerQuestion' min={1} max={10} />

                <SubmitFormButton isSubmitting={isSubmitting} label={SUBMIT_BUTTON_LABEL[lang]} />
            </Form>
        </Formik>
    )
}

const ROUND_TITLE_LABEL = {
    'en': "Title of the round",
    'fr-FR': "Titre de la manche"
}

const SUBMIT_BUTTON_LABEL = {
    'en': "Create",
    'fr-FR': "Créer"
}