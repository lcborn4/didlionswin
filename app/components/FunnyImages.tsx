'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface FunnyImagesProps {
    gameResult?: 'WIN' | 'LOSS' | 'TIE' | null;
    isLoading?: boolean;
}

export default function FunnyImages({ gameResult, isLoading }: FunnyImagesProps) {
    const [currentImage, setCurrentImage] = useState<string | null>(null);
    const [imageAlt, setImageAlt] = useState<string>('');

    // Image collections
    const goodImages = [
        { src: '/images/good/lionswin.jpg', alt: 'Lions Win Celebration' },
        { src: '/images/good/hutchinson_sack.jpg', alt: 'Hutchinson Sack' },
        { src: '/images/good/cook_fumble.jpg', alt: 'Cook Fumble Recovery' }
    ];

    const badImages = [
        { src: '/images/bad/lionsfanbag.jpg', alt: 'Sad Lions Fan' },
        { src: '/images/bad/lions_broncos.jpeg', alt: 'Lions Broncos Loss' },
        { src: '/images/bad/bearsthanksgiving2021.jpeg', alt: 'Bears Thanksgiving 2021' },
        { src: '/images/bad/dlwaf.jpg', alt: 'DLWAF' },
        { src: '/images/bad/harrington.jpg', alt: 'Harrington' }
    ];

    const randomImages = [
        { src: '/images/aslan-roar.gif', alt: 'Aslan Roar' },
        { src: '/images/kitty-cat.gif', alt: 'Kitty Cat' },
        { src: '/images/out.gif', alt: 'Out' },
        { src: '/images/IMG_8922.GIF', alt: 'Lions GIF' },
        { src: '/images/koolaid_lions.jpeg', alt: 'Kool Aid Lions' },
        { src: '/images/Detroit-Lions-emblem.jpg', alt: 'Detroit Lions Emblem' },
        { src: '/images/IMG_1090.jpeg', alt: 'Lions Image' },
        { src: '/images/GdgB9HaWYAAP_BW.jpeg', alt: 'Lions Image' },
        { src: '/images/GdgLgm5XcAAKXl0.jpeg', alt: 'Lions Image' }
    ];

    useEffect(() => {
        if (isLoading) {
            setCurrentImage(null);
            return;
        }

        let imagePool: typeof goodImages | typeof badImages | typeof randomImages;
        let poolName: string;

        if (gameResult === 'WIN') {
            // 70% chance of good image, 30% chance of random image
            if (Math.random() < 0.7) {
                imagePool = goodImages;
                poolName = 'good';
            } else {
                imagePool = randomImages;
                poolName = 'random';
            }
        } else if (gameResult === 'LOSS') {
            // 70% chance of bad image, 30% chance of random image
            if (Math.random() < 0.7) {
                imagePool = badImages;
                poolName = 'bad';
            } else {
                imagePool = randomImages;
                poolName = 'random';
            }
        } else {
            // No game result, show random image
            imagePool = randomImages;
            poolName = 'random';
        }

        // Select random image from the pool
        const randomIndex = Math.floor(Math.random() * imagePool.length);
        const selectedImage = imagePool[randomIndex];

        setCurrentImage(selectedImage.src);
        setImageAlt(selectedImage.alt);

        console.log(`Selected ${poolName} image: ${selectedImage.src}`);
    }, [gameResult, isLoading]);

    if (isLoading || !currentImage) {
        return null;
    }

    return (
        <div className="funny-image-container" style={{
            margin: '20px 0',
            textAlign: 'center',
            maxWidth: '100%',
            overflow: 'hidden',
            borderRadius: '8px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
        }}>
            <Image
                src={currentImage}
                alt={imageAlt}
                width={400}
                height={300}
                style={{
                    maxWidth: '100%',
                    height: 'auto',
                    borderRadius: '8px'
                }}
                priority={false}
            />
        </div>
    );
}
