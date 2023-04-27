import { useEffect, useState } from 'react';
import Confetti from 'react-confetti';

export default ({ duration = 4000 }) => {
    const [{ width, height }, setWindowSize] = useState({ width: 0, height: 0 });
    const [recycle, setRecycle] = useState(true);

    const colors = new Array(17).fill('#1f2937');

    useEffect(() => {
        setTimeout(() => {
            setRecycle(false);
        }, duration);

        const handleResize = () => {
            setWindowSize({
                width: window.innerWidth - 20,
                height: window.innerHeight - 20,
            });
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <Confetti width={width} height={height} colors={colors} recycle={recycle} />
    );
};
