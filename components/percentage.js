import { useEffect, useState } from 'react';
import { Loading } from '@johackim/design-system';
import { useTranslation } from 'react-i18next';

const MAX_TASK_TIME = process.env.NODE_ENV === 'production' ? 3 : 1;

const remainingTimePercentage = (date) => {
    const now = new Date().getTime();
    const updatedAt = new Date(date);
    const expiryTime = new Date(updatedAt.getTime() + MAX_TASK_TIME * 60 * 1000);
    const startTime = updatedAt.getTime();
    const endTime = expiryTime.getTime();
    const percentage = ((now - startTime) / (endTime - startTime)) * 100;

    return percentage >= 100 ? 100 : Math.round(percentage);
};

export default ({ updatedAt }) => {
    const [percentage, setPercentage] = useState(remainingTimePercentage(updatedAt));
    const { t } = useTranslation();

    useEffect(() => {
        const interval = setInterval(() => {
            setPercentage(remainingTimePercentage(updatedAt));
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    if (percentage >= 100) return null;

    return (
        <>
            <div className="absolute inset-0 flex items-center justify-center text-center opacity-90 bg-white rounded-lg !cursor-not-allowed" />
            <div className="text-gray-700 absolute inset-y-auto text-center w-full p-4 !cursor-not-allowed" style={{ transform: 'translate(-50%, -50%)', top: '50%', left: '50%' }}>
                <Loading className="font-bold" text={t('Action in progress')} />
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
