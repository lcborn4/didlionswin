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
        // For now, just show out.gif until the Lions first game
        if (!isLoading) {
            setCurrentImage('/images/good/out.gif');
            setImageAlt('Out');
            console.log('Showing out.gif until first game of season');
        }
    }, [isLoading]);

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
