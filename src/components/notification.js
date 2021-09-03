import React from 'react';
import { useIntl } from 'gatsby-plugin-intl';

export default ({ title, type, message, onConfirm, onClose }) => {
    const intl = useIntl();

    return (
        <div className="fixed inset-0 flex items-end justify-center px-4 py-6 pointer-events-none sm:p-6 sm:items-start sm:justify-end transform ease-out duration-300 transition z-50 mt-15 notification">
            <div className="max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto">
                <div className="rounded-lg shadow-xs overflow-hidden">
                    <div className="p-4">
                        <div className="flex items-start">
                            { type === 'success' && (
                                <div className="flex-shrink-0">
                                    <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            ) }
                            { type === 'error' && (
                                <div className="flex-shrink-0">
                                    <svg className="h-6 w-6 text-red-400" stroke="currentColor" viewBox="0 0 24 24">
                                        <path d="M4.93 19.07A10 10 0 1 1 19.07 4.93 10 10 0 0 1 4.93 19.07zm1.41-1.41A8 8 0 1 0 17.66 6.34 8 8 0 0 0 6.34 17.66zM13.41 12l1.42 1.41a1 1 0 1 1-1.42 1.42L12 13.4l-1.41 1.42a1 1 0 1 1-1.42-1.42L10.6 12l-1.42-1.41a1 1 0 1 1 1.42-1.42L12 10.6l1.41-1.42a1 1 0 1 1 1.42 1.42L13.4 12z" />
                                    </svg>
                                </div>
                            ) }
                            <div className="ml-3 w-0 flex-1 pt-0.5">
                                <p className="text-sm leading-5 font-medium text-gray-900">{title}</p>
                                { message && <p className="mt-1 text-sm leading-5 text-gray-500">{message}</p> }
                                { type === 'confirm' && (
                                    <div className="mt-4 flex">
                                        <span className="inline-flex rounded-md shadow-sm">
                                            <button onClick={onConfirm} type="button" id="confirm" className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-gray-600 hover:bg-gray-500 focus:outline-none focus:border-gray-700 focus:shadow-outline-gray active:bg-gray-700 transition ease-in-out duration-150">
                                                {intl.formatMessage({ id: 'Confirm' })}
                                            </button>
                                        </span>
                                        <span className="ml-3 inline-flex rounded-md shadow-sm">
                                            <button onClick={onClose} type="button" className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:text-gray-500 focus:outline-none focus:border-gray-300 focus:shadow-outline-gray active:text-gray-800 active:bg-gray-50 transition ease-in-out duration-150">
                                                {intl.formatMessage({ id: 'Cancel' })}
                                            </button>
                                        </span>
                                    </div>
                                ) }
                            </div>
                            <div className="ml-4 flex-shrink-0 flex">
                                <button type="button" onClick={onClose} className="inline-flex text-gray-400 focus:outline-none focus:text-gray-500 transition ease-in-out duration-150">
                                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
