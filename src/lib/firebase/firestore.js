import {
    collection,
    onSnapshot,
    query,
    getDocs,
    doc,
    getDoc,
    updateDoc,
    orderBy,
    Timestamp,
    runTransaction,
    where,
    addDoc,
} from "firebase/firestore";
import { firestore } from "./firebase";

export const USERS_COLLECTION_REF = collection(firestore, 'users')
export const QUESTIONS_COLLECTION_REF = collection(firestore, 'questions')
export const GAMES_COLLECTION_REF = collection(firestore, 'games')


function applyQuestionQueryFilters(q, { lang, topic, type, keyword, sort, approved = true }) {
    if (approved) {
        q = query(q, where("approved", "==", approved));
    }
    if (lang) {
        q = query(q, where("lang", "==", lang));
    }
    if (topic) {
        q = query(q, where("topic", "==", topic));
    }
    if (type) {
        q = query(q, where("type", "==", type));
    }
    if (keyword) {
        q = query(q, where("keywords", "array-contains", keyword));
    }
    if (sort === "Date of creation" || !sort) {
        q = query(q, orderBy("createdAt", "desc"));
        // } else if (sort === "Review") {
        // q = query(q, orderBy("numRatings", "desc"));
    }
    return q;
}


export async function getQuestions(filters = {}) {
    let q = query(QUESTIONS_COLLECTION_REF);

    q = applyQuestionQueryFilters(q, filters);
    const results = await getDocs(q);
    return results.docs.map(doc => {
        return {
            id: doc.id,
            ...doc.data(),
            // Only plain objects can be passed to Client Components from Server Components
            createdAt: doc.data().createdAt.toDate(),
        };
    });
}

export async function updateQuestionImageReference(
    questionId,
    publicImageUrl,
    isAnswer = false
) {
    const questionRef = doc(QUESTIONS_COLLECTION_REF, questionId);
    if (questionRef) {
        if (isAnswer) {
            await updateDoc(questionRef, { ['details.answer.image']: publicImageUrl });
        } else {
            await updateDoc(questionRef, { ['details.image']: publicImageUrl });
        }
    }
}

export async function updateQuestionAudioReference(
    questionId,
    publicAudioUrl
) {
    const questionRef = doc(QUESTIONS_COLLECTION_REF, questionId);
    if (questionRef) {
        await updateDoc(questionRef, { ['details.audio']: publicAudioUrl });
    }
}


export async function addNewQuestion(question) {
    if (!question) {
        throw new Error("A valid question has not been provided.");
    }

    try {
        const newQuestionRef = await addDoc(QUESTIONS_COLLECTION_REF, question)
        console.log("Document written with ID: ", newQuestionRef.id);
        return newQuestionRef.id;
    } catch (error) {
        console.error("There was an error adding the question:", error);
        throw error;
    }
}