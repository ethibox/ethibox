import React from 'react';
import { useIntl } from 'gatsby-plugin-intl';

export default (props) => {
    const { content, confirmButton, closeButton, confirmClass, onClose, onConfirm } = props;
    const intl = useIntl();

    return (
        <div className="fixed bottom-0 inset-x-0 px-4 pb-6 sm:inset-0 sm:p-0 sm:flex sm:items-center sm:justify-center z-20">
            <div className="fixed inset-0 transition-opacity">
                <div className="absolute inset-0 bg-gray-500 opacity-75" />
            </div>

            <div className="bg-white rounded-lg px-4 pt-5 pb-4 overflow-hidden shadow-xl transform transition-all sm:max-w-lg sm:w-full sm:p-6" role="dialog" aria-modal="true" aria-labelledby="modal-headline">
                <div>{content}</div>
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                    <span className="flex w-full rounded-md shadow-sm sm:col-start-2">
                        <button onClick={onConfirm} type="button" className={`inline-flex justify-center w-full rounded-md border border-transparent px-4 py-2 bg-gray-600 text-base leading-6 font-medium text-white shadow-sm hover:bg-gray-500 focus:outline-none focus:border-gray-700 focus:shadow-outline-gray transition ease-in-out duration-150 sm:text-sm sm:leading-5 ${confirmClass}`}>
                            {confirmButton || 'Confirm'}
                        </button>
                    </span>
                    <span className="mt-3 flex w-full rounded-md shadow-sm sm:mt-0 sm:col-start-1">
                        <button onClick={onClose} type="button" className="inline-flex justify-center w-full rounded-md border border-gray-300 px-4 py-2 bg-white text-base leading-6 font-medium text-gray-700 shadow-sm hover:text-gray-500 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue transition ease-in-out duration-150 sm:text-sm sm:leading-5">
                            {closeButton || intl.formatMessage({ id: 'Cancel' })}
                        </button>
                    </span>
                </div>
            </div>
        </div>
    );
};
