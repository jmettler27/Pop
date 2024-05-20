"use server";

import { addDoc, collection, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebase/firebase";
import { updateQuestionImage, uploadQuestionImage } from '@/lib/firebase/storage';
import { addNewQuestion } from "@/lib/firebase/firestore";

import { QUESTIONS_COLLECTION_REF } from '@/lib/firebase/firestore';

// Server Actions are asynchronous functions that are executed on the server. 
// They can be used in Server and Client Components to handle form submissions and data mutations in Next.js applications.

// A Next.js Server Action provides a convenient API to access form data, 
// such as data.get("text") to get the text value from the form submission payload.

// import { addReviewToRestaurant } from "@/src/lib/firebase/firestore.js";
// import { getAuthenticatedAppForUser } from "@/src/lib/firebase/firebase";
// import { getFirestore } from "firebase/firestore";

// This is a next.js server action, an alpha feature, so
// use with caution
// https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions
// export async function handleReviewFormSubmission(data) {
//     const { app } = await getAuthenticatedAppForUser();
//     const db = getFirestore(app);

//     await addReviewToRestaurant(db, data.get("restaurantId"), {
//         text: data.get("text"),
//         rating: data.get("rating"),

//         // This came from a hidden form field
//         userId: data.get("userId"),
//     });
// }

export async function handleQuestionFormSubmission(values, userId, image) {
    if (!data) {
        throw new Error("No data");
    }
    if (!image) {
        throw new Error("No image file");
    }
    if (!userId) {
        throw new Error("No user ID");
    }

    try {
        const { files, ...content } = values;

        const questionId = await addNewQuestion({
            ...content,
            createdAt: serverTimestamp(),
            createdBy: userId,
        })
        console.log("Question ID:", questionId)
        await updateQuestionImage(questionId, image);

    } catch (error) {
        console.error("There was an error handling the form:", error)
        throw error;

    }
}


export async function handleProgressiveCluesFormSubmission(values, userId) {
    const image = fileRef?.current?.files ? fileRef.current.files[0] : null;
    if (!image) {
        throw new Error("No image file");
    }
    console.log("Form values:", values)

    const { files, ...values1 } = values;

    const docRef = await addDoc(QUESTIONS_COLLECTION_REF, {
        ...values1,
        image: "",
        createdAt: serverTimestamp(),
        createdBy: userId,
    })

    const url = await uploadQuestionImage(docRef.id, image);
    await updateDoc(docRef, { image: url });
}

export async function handleEmojiFormSubmission(values, userId) {
    const image = fileRef?.current?.files ? fileRef.current.files[0] : null;
    if (!image) {
        throw new Error("No image file");
    }
    console.log("Form values:", values)

    const { files, ...values1 } = values;

    const docRef = await addDoc(QUESTIONS_COLLECTION_REF, {
        ...values1,
        image: "",
        createdAt: serverTimestamp(),
        createdBy: userId,
    })

    const url = await uploadQuestionImage(docRef.id, image);
    await updateDoc(docRef, { image: url });
}

export async function handleImageFormSubmission(values, userId) {
    return
    const files = fileRef?.current?.files;
    const image = files ? files[0] : null;
    if (!image) {
        throw new Error("No image file");
    }

    console.log("Image:", image)

    const { files1, ...values1 } = values;

    const docRef = await addDoc(QUESTIONS_COLLECTION_REF, {
        ...values1,
        image: "",
        createdAt: serverTimestamp(),
        createdBy: userId,
    })

    const url = await uploadQuestionImage(docRef.id, image);
    await updateDoc(docRef, { image: url });
}