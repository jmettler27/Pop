import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

import { storage } from "@/lib/firebase/firebase";

import { updateQuestionAudioReference, updateQuestionImageReference } from "@/lib/firebase/firestore";

export async function updateQuestionImage(questionId, image, isAnswer = false) {
    try {
        if (!questionId)
            throw new Error("No question ID has been provided.");

        if (!image || !image.name)
            throw new Error("A valid image has not been provided.");

        const publicImageUrl = await uploadQuestionImage(questionId, image);
        await updateQuestionImageReference(questionId, publicImageUrl, isAnswer);

        return publicImageUrl;
    } catch (error) {
        console.error("There was an error updating the question image:", error);
    }
}

export async function uploadQuestionImage(questionId, image) {
    const filePath = `questions/images/${questionId}`;
    const newImageRef = ref(storage, filePath);
    await uploadBytesResumable(newImageRef, image);

    return await getDownloadURL(newImageRef);
}

export async function updateQuestionAudio(questionId, audio) {
    try {
        if (!questionId)
            throw new Error("No question ID has been provided.");

        if (!audio || !audio.name)
            throw new Error("A valid audio has not been provided.");

        const publicAudioUrl = await uploadQuestionAudio(questionId, audio);
        await updateQuestionAudioReference(questionId, publicAudioUrl);

        return publicAudioUrl;
    } catch (error) {
        console.error("Error processing request:", error);
    }
}

export async function uploadQuestionAudio(questionId, audio) {
    const filePath = `questions/audio/${questionId}`;
    const newAudioRef = ref(storage, filePath);
    await uploadBytesResumable(newAudioRef, audio);

    return await getDownloadURL(newAudioRef);
}