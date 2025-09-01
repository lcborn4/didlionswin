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
        { src: '/images/good/cook_fumble.jpg', alt: 'Cook Fumble Recovery' },
        { src: '/images/good/aslan-roar.gif', alt: 'Aslan Roar' },
        { src: '/images/good/IMG_8922.GIF', alt: 'Lions GIF' },
        { src: '/images/good/IMG_1090.jpeg', alt: 'Lions Image' },
        { src: '/images/good/GdgB9HaWYAAP_BW.jpeg', alt: 'Lions Image' },
        { src: '/images/good/GdgLgm5XcAAKXl0.jpeg', alt: 'Lions Image' }
    ];

    const badImages = [
        { src: '/images/bad/lionsfanbag.jpg', alt: 'Sad Lions Fan' },
        { src: '/images/bad/lions_broncos.jpeg', alt: 'Lions Broncos Loss' },
        { src: '/images/bad/bearsthanksgiving2021.jpeg', alt: 'Bears Thanksgiving 2021' },
        { src: '/images/bad/dlwaf.jpg', alt: 'DLWAF' },
        { src: '/images/bad/harrington.jpg', alt: 'Harrington' },
        { src: '/images/bad/kitty-cat.gif', alt: 'Kitty Cat' }
    ];

    const randomImages = [
        { src: '/images/koolaid_lions.jpeg', alt: 'Kool Aid Lions' },
        { src: '/images/Detroit-Lions-emblem.jpg', alt: 'Detroit Lions Emblem' }
    ];

    useEffect(() => {
        if (isLoading) {
            setCurrentImage(null);
            return;
        }

        // Show out.gif until there's an actual game result this season
        if (!gameResult || gameResult === null) {
            setCurrentImage('/images/good/out.gif');
            setImageAlt('Out');
            console.log('No game result yet - showing out.gif');
            return;
        }

        let imagePool: typeof goodImages | typeof badImages;
        let poolName: string;

        if (gameResult === 'WIN') {
            // Only show good images when they win
            imagePool = goodImages;
            poolName = 'good';
        } else if (gameResult === 'LOSS') {
            // Only show bad images when they lose
            imagePool = badImages;
            poolName = 'bad';
        } else {
            // This shouldn't happen now, but fallback to out.gif
            setCurrentImage('/images/out.gif');
            setImageAlt('Out');
            console.log('Fallback to out.gif');
            return;
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
