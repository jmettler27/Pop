import Image from 'next/image'

export default function FirebaseImage({ url, alt, height = '100%' }) {

    return (
        <Image
            src={url}
            alt={alt}
            width={0}
            height={0}
            style={{ width: 'auto', height: height }}
        />)
}
