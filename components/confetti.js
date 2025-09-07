import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const Confetti = dynamic(() => import('react-confetti'), { ssr: false });

export default ({ show, recycle = false, className = '', ...props }) => {
    const [size, setSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;

        const update = () => setSize({
            width: window.innerWidth - 20,
            height: window.innerHeight - 20,
        });

        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);

    if (!show || size.width === 0) return null;

    return (
        <Confetti
            className={`!z-50 ${className}`}
            width={size.width}
            height={size.height}
            recycle={recycle}
            {...props}
        />
    );
};
