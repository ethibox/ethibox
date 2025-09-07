export default ({ text = 'Loading...', size = 'base', className = '', ...rest }) => {
    const circleClassName = {
        base: 'w-4 h-4',
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        xl: 'w-8 h-8',
    };

    const textClassName = {
        base: 'text-base',
        sm: 'text-sm',
        md: 'text-xl',
        xl: 'text-3xl',
    };

    return (
        <div className={`text-gray-700 inline-flex align-middle items-center ${textClassName[size]} ${className}`} data-test="loading" {...rest}>
            <svg className={`mr-1 ${circleClassName[size]}`} viewBox="0 0 100 100" preserveAspectRatio="xMidYMid">
                <circle cx="50" cy="50" fill="none" className="stroke-current" strokeWidth="10" r="35" strokeDasharray="164.93361431346415 56.97787143782138">
                    <animateTransform attributeName="transform" type="rotate" repeatCount="indefinite" dur="1s" values="0 50 50;360 50 50" keyTimes="0;1" />
                </circle>
            </svg>
            {text && <span>{text}</span>}
        </div>
    );
};
