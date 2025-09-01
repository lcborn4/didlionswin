'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

// Import facts
import badFacts from '../../assets/bad_facts.json';
import goodFacts from '../../assets/good_facts.json';

interface FunnyImagesProps {
    gameResult?: 'WIN' | 'LOSS' | 'TIE' | null;
    isLoading?: boolean;
}

export default function FunnyImages({ gameResult, isLoading }: FunnyImagesProps) {
    const [currentImage, setCurrentImage] = useState<string | null>(null);
    const [imageAlt, setImageAlt] = useState<string>('');
    const [currentFact, setCurrentFact] = useState<string>('');

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
            setCurrentFact('');
            return;
        }

        // Show out.gif until there's an actual game result this season
        if (!gameResult || gameResult === null) {
            setCurrentImage('/images/good/out.gif');
            setImageAlt('Out');
            setCurrentFact(''); // No fact until season starts
            console.log('No game result yet - showing out.gif (no fact)');
            return;
        }

        let imagePool: typeof goodImages | typeof badImages;
        let factPool: typeof goodFacts | typeof badFacts;
        let poolName: string;

        if (gameResult === 'WIN') {
            // Show good images and good facts when they win
            imagePool = goodImages;
            factPool = goodFacts;
            poolName = 'good';
        } else if (gameResult === 'LOSS') {
            // Show bad images and bad facts when they lose
            imagePool = badImages;
            factPool = badFacts;
            poolName = 'bad';
        } else {
            // This shouldn't happen now, but fallback to out.gif
            setCurrentImage('/images/good/out.gif');
            setImageAlt('Out');
            setCurrentFact('');
            console.log('Fallback to out.gif');
            return;
        }

        // Select random image from the pool
        const randomImageIndex = Math.floor(Math.random() * imagePool.length);
        const selectedImage = imagePool[randomImageIndex];

        // Select random fact from the pool
        const randomFactIndex = Math.floor(Math.random() * factPool.length);
        const selectedFact = factPool[randomFactIndex];

        setCurrentImage(selectedImage.src);
        setImageAlt(selectedImage.alt);
        setCurrentFact(selectedFact.fact);
        console.log(`Selected ${poolName} image: ${selectedImage.src} and fact: ${selectedFact.fact}`);
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
            
            {/* Display fact if available */}
            {currentFact && (
                <div style={{
                    marginTop: '15px',
                    padding: '15px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    border: '2px solid #e9ecef',
                    fontSize: '1.1rem',
                    fontStyle: 'italic',
                    color: '#495057',
                    maxWidth: '600px',
                    margin: '15px auto 0'
                }}>
                    💡 {currentFact}
                </div>
            )}
        </div>
    );
}
