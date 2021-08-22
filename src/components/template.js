import React, { useState } from 'react';
import { withPrefix } from 'gatsby';
import { useLocation } from '@reach/router';
import { useRecoilValue } from 'recoil';
import { useIntl } from 'gatsby-plugin-intl';

import { getToken, checkStatus, navigate, autocast } from '../utils';
import { stripeState } from '../atoms';
import { withNotifier } from '../context/NotificationContext';

export default withNotifier(({ template, notify }) => {
    const intl = useIntl();
    const location = useLocation();
    const [isLoading, updateLoading] = useState(false);
    const { stripeEnabled } = useRecoilValue(stripeState);

    const { id: templateId, name, category, logo, website } = template;

    const installApplication = async () => {
        const response = await fetch(withPrefix('/graphql'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-access-token': getToken() },
            body: JSON.stringify({ query: `mutation {
                installApplication(templateId: ${templateId})
            }` }),
        })
            .then(checkStatus)
            .then(() => {
                navigate('/apps');
            })
            .catch(({ message }) => {
                updateLoading(false);
                notify({ type: 'error', title: intl.formatMessage({ id: message }) });
            });

        return response;
    };

    const handleClick = async () => {
        updateLoading(true);

        if (!autocast(stripeEnabled)) {
            await installApplication();
            return;
        }

        const baseUrl = `${location.protocol}//${location.host}${withPrefix('/')}`;

        await fetch(withPrefix('/graphql'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-access-token': getToken() },
            body: JSON.stringify({ query: `mutation {
                createSessionCheckout(templateId: ${templateId}, baseUrl: "${baseUrl}")
            }` }),
        })
            .then(checkStatus)
            .then(({ data }) => {
                const url = data.createSessionCheckout;

                if (typeof document !== 'undefined') {
                    document.location.href = url;
                }
            })
            .catch(({ message }) => {
                updateLoading(false);
                notify({ type: 'error', title: intl.formatMessage({ id: message }) });
            });
    };

    return (
        <>
            <div className="bg-white overflow-hidden shadow rounded-lg" key={name}>
                <div className="px-4 py-5 sm:p-6 lg:p-4">
                    <div className="flex-1">
                        <div className="flex justify-between">
                            <div>
                                <h1 className="font-bold">{name}</h1>
                                <h2 className="capitalize text-sm">{category}</h2>
                            </div>
                            <img src={logo} alt="logo" className="w-14 h-14" />
                        </div>

                        { website && (
                            <a href={website} target="_blank" className="text-sm font-medium text-gray-500 underline break-all domain">{intl.formatMessage({ id: 'More infos' })}</a>
                        ) }
                    </div>

                    <div className="mt-8 border-t border-gray-200 pt-5">
                        <button
                            type="button"
                            onClick={handleClick}
                            className="inline-flex justify-center w-full rounded-md border border-gray-300 px-4 py-2 bg-white text-base leading-6 font-medium text-gray-700 shadow-sm hover:text-gray-500 focus:outline-none focus:border-gray-300 focus:shadow-outline-gray transition ease-in-out duration-150 sm:text-sm sm:leading-5"
                        >
                            { isLoading ? (
                                <>
                                    <span className="w-4 h-4 mr-2">
                                        <img src={`${withPrefix('/spinner-black.svg')}`} alt="spinner" className="spinner" />
                                    </span>
                                    {intl.formatMessage({ id: 'Loading...' })}
                                </>
                            ) : (
                                <span>{intl.formatMessage({ id: 'Install application' })}</span>
                            ) }
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
});
