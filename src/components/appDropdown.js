import React, { useState, useRef, useEffect } from 'react';
import { useIntl } from 'gatsby-plugin-intl';

export default ({ actions }) => {
    const intl = useIntl();
    const ref = useRef();

    const [dropdown, setDropdown] = useState(false);

    const handleClickOutside = (e) => {
        if (!ref.current.contains(e.target)) {
            setDropdown(false);
        }
    };

    useEffect(() => {
        document.addEventListener('click', handleClickOutside, true);
        return () => document.removeEventListener('click', handleClickOutside, true);
    }, []);

    return (
        <>
            <div ref={ref} className="relative block w-full">
                <button
                    onClick={() => setDropdown(!dropdown)}
                    type="button"
                    aria-label="Expand"
                    className="w-full relative inline-flex justify-between items-center px-4 py-2 rounded-md border border-gray-300 bg-white text-sm leading-5 font-medium text-gray-700 hover:text-gray-500 focus:z-10 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue active:bg-gray-100 active:text-gray-700 transition ease-in-out duration-150"
                >
                    <span>{intl.formatMessage({ id: actions[0].text })}</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
                { dropdown && (
                    <div className="origin-top-right absolute right-0 mt-2 -mr-1 w-56 rounded-md shadow-lg z-10">
                        <div className="rounded-md bg-white shadow-xs">
                            <div className="py-1">
                                { actions.slice(1).map(({ text, action }) => {
                                    return (
                                        <button
                                            type="button"
                                            onClick={action}
                                            className="block w-full text-left px-4 py-2 text-sm leading-5 text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:bg-gray-100 focus:text-gray-900"
                                        >
                                            {intl.formatMessage({ id: text })}
                                        </button>
                                    );
                                }) }
                            </div>
                        </div>
                    </div>
                ) }
            </div>
        </>
    );
};
