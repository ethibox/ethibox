import { useState, useEffect } from 'react';
import { STANDBY_TIMEOUT } from '../lib/constants';
import Loading from './loading';

const START_PERCENTAGE = 5;

const calculatePercentage = (updatedAt) => {
    const elapsedTime = Date.now() - new Date(updatedAt).getTime();
    if (elapsedTime >= STANDBY_TIMEOUT) return 100;
    const progress = (elapsedTime / STANDBY_TIMEOUT) * 100;
    const percentage = START_PERCENTAGE + (progress * (100 - START_PERCENTAGE)) / 100;
    return Math.floor(percentage);
};

export default ({ updatedAt, text = 'Action in progress' }) => {
    const [percentage, setPercentage] = useState(() => calculatePercentage(updatedAt));

    useEffect(() => {
        const timer = setInterval(() => {
            setPercentage(calculatePercentage(updatedAt));
        }, 1000);

        return () => clearInterval(timer);
    }, [updatedAt]);

    if (percentage >= 100) {
        return null;
    }

    return (
        <>
            <div className="absolute inset-0 flex items-center justify-center text-center opacity-90 bg-white rounded-lg !cursor-not-allowed" />
            <div className="text-gray-700 absolute inset-y-auto text-center w-full p-4 !cursor-not-allowed" style={{ transform: 'translate(-50%, -50%)', top: '50%', left: '50%' }}>
                <Loading className="font-bold" text={text} />
                <div className="w-full bg-gray-300 rounded-md mt-2">
                    <div
                        className="bg-gray-500 text-xs leading-none py-1 text-center font-bold text-white rounded-md"
                        style={{ width: `${percentage}%` }}
                    >
                        {`${percentage}%`}
                    </div>
                </div>
            </div>
        </>
    );
};
