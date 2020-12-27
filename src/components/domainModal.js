import React from 'react';
import { useIntl } from 'gatsby-plugin-intl';

import Construction from '../images/construction.svg';

export default ({ onClose }) => {
    const intl = useIntl();

    return (
        <div className="fixed bottom-0 inset-x-0 px-4 pb-6 sm:inset-0 sm:p-0 sm:flex sm:items-center sm:justify-center z-30">
            <div className="fixed inset-0 transition-opacity">
                <div className="absolute inset-0 bg-gray-500 opacity-75" />
            </div>

            <div className="bg-white rounded-lg px-4 pt-5 pb-4 overflow-hidden shadow-xl transform transition-all sm:max-w-lg sm:w-full sm:p-6" role="dialog" aria-modal="true" aria-labelledby="modal-headline">
                <div>
                    <Construction className="w-24 m-auto" fill="gray" />
                    <h4 className="text-center text-2xl">{intl.formatMessage({ id: 'Coming soon' })}...</h4>
                </div>
                <span className="flex w-full rounded-md shadow-sm mt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex justify-center w-full rounded-md border border-gray-300 px-4 py-2 bg-white text-base leading-6 font-medium text-gray-700 shadow-sm hover:text-gray-500 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue transition ease-in-out duration-150 sm:text-sm sm:leading-5"
                    >
                        {intl.formatMessage({ id: 'Back' })}
                    </button>
                </span>
            </div>
        </div>
    );
};
