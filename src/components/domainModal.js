import React, { useState } from 'react';
import { withPrefix } from 'gatsby';
import { useIntl } from 'gatsby-plugin-intl';
import { isFQDN } from 'validator';

import { withNotifier } from '../context/NotificationContext';
import { getToken, checkStatus } from '../utils';

export default withNotifier(({ onClose, application, notify }) => {
    const intl = useIntl();
    const [state, setState] = useState({ domain: application.domain, ip: null, error: false, success: false, isLoading: false });
    const { releaseName } = application;

    const handleChange = async (e) => {
        const { name, value } = e.target;
        setState({ ...state, [name]: value, error: false });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const { domain } = state;

        setState({ ...state, isLoading: true });

        if (!isFQDN(domain)) {
            setState({ ...state, isLoading: false, error: 'Nom de domaine invalide' });
            return;
        }

        await fetch(withPrefix('/graphql'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-access-token': getToken() },
            body: JSON.stringify({ query: `mutation {
                updateAppDomain(releaseName: "${releaseName}", domain: "${domain}")
            }` }),
        })
            .then(checkStatus)
            .then(() => {
                notify({ type: 'success', title: intl.formatMessage({ id: 'Domain change with success, please wait 5 minutes during the SSL certification creation process' }) });
                setState({ ...state, isLoading: false });
                onClose();
            })
            .catch(({ message, extensions }) => {
                const ip = extensions.exception.ip || null;
                setState({ ...state, isLoading: false, domain, ip, error: message });
            });
    };

    const { domain, ip, isLoading, error } = state;

    return (
        <div className="fixed bottom-0 inset-x-0 px-4 pb-6 sm:inset-0 sm:p-0 sm:flex sm:items-center sm:justify-center z-30">
            <div className="fixed inset-0 transition-opacity">
                <div className="absolute inset-0 bg-gray-500 opacity-75" />
            </div>

            <div className="bg-white rounded-lg px-4 pt-5 pb-4 overflow-hidden shadow-xl transform transition-all sm:max-w-lg sm:w-full sm:p-6" role="dialog" aria-modal="true" aria-labelledby="modal-headline">
                <div className="col-span-2">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">Editer le nom de domaine</h3>
                    <p className="mt-1 text-sm leading-5 text-gray-500">Entrez un nom de domaine personnalisé que vous souhaitez utiliser pour votre application. (ex: <code>mondomaine.fr</code> ou <code>blog.mondomaine.fr</code>)</p>
                </div>

                <form action="#" method="POST" onSubmit={handleSubmit}>
                    <div className="my-4">
                        <div className="mt-1 flex rounded-md shadow-sm">
                            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                                https://
                            </span>
                            <input
                                type="text"
                                onChange={handleChange}
                                name="domain"
                                value={domain}
                                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md focus:ring-gray-300 focus:border-gray-300 sm:text-sm border border-gray-300"
                                placeholder="mondomaine.fr"
                            />
                        </div>
                    </div>

                    { error && (
                        <p className="mt-2 text-sm text-red-600">
                            {intl.formatMessage({ id: error }, { domain, ip })}
                        </p>
                    ) }

                    <div className="mt-6 gap-2 grid sm:grid-cols-2">
                        <span className="flex w-full rounded-md shadow-sm">
                            <button
                                type="button"
                                onClick={onClose}
                                className="inline-flex justify-center w-full rounded-md border border-gray-300 px-4 py-2 bg-white text-base leading-6 font-medium text-gray-700 shadow-sm hover:text-gray-500 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue transition ease-in-out duration-150 sm:text-sm sm:leading-5"
                            >
                                {intl.formatMessage({ id: 'Back' })}
                            </button>
                        </span>
                        <span className="relative flex w-full rounded-md shadow-sm">
                            <button
                                onClick={handleSubmit}
                                type="button"
                                className="inline-flex justify-center w-full rounded-md border border-transparent px-4 py-2 bg-gray-600 text-base leading-6 font-medium text-white shadow-sm hover:bg-gray-500 focus:outline-none focus:border-gray-700 focus:shadow-outline-gray transition ease-in-out duration-150 sm:text-sm sm:leading-5"
                            >
                                { isLoading ? (
                                    <>
                                        <span className="w-4 h-4">
                                            <img src={`${withPrefix('/spinner.svg')}`} alt="spinner" className="spinner" />
                                        </span>
                                    </>
                                ) : (
                                    <span>{intl.formatMessage({ id: 'Update domain' })}</span>
                                ) }
                            </button>
                        </span>
                    </div>
                </form>
            </div>
        </div>
    );
});
