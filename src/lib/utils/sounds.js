import { storage } from '@/lib/firebase/firebase'
import { ref, listAll, getDownloadURL } from 'firebase/storage'

export async function loadSounds() {
    const soundsRef = ref(storage, 'sounds')
    try {
        const { items } = await listAll(soundsRef)
        const sounds = {}
        for (const item of items) {
            const name = item.name.split('.')[0]
            const url = await getDownloadURL(item)
            sounds[name] = { name, url }
        }
        return sounds
    } catch (err) {
        console.error(err)
        return {}
    }
}
