import React from 'react';
import { withPrefix } from 'gatsby';
import { useIntl } from 'gatsby-plugin-intl';
import { useImmer } from 'use-immer';
import { useRecoilValue } from 'recoil';

import { withNotifier } from '../context/NotificationContext';
import { checkStatus, getToken } from '../utils';
import AdminSettingsList from './adminSettingsList';
import AdminSettingsWebhooks from './adminSettingsWebhooks';
import { adminSettingsState, userState } from '../atoms';

export default withNotifier((props) => {
    const intl = useIntl();

    const { isAdmin } = useRecoilValue(userState);

    if (!isAdmin) {
        return false;
    }

    const [isLoading, updateLoading] = useImmer(false);
    const { webhooks, settings } = useRecoilValue(adminSettingsState);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { notify } = props;

        updateLoading(() => true);

        const variables = {
            settings: settings.map(({ name, value }) => ({ name, value })),
            webhooks: webhooks.map(({ event, targetUrl }) => ({ event, targetUrl })),
            templatesUrl: (settings.find(({ name }) => name === 'templatesUrl')
                          && settings.find(({ name }) => name === 'templatesUrl').value) || '',
        };

        await fetch(withPrefix('/graphql'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-access-token': getToken() },
            body: JSON.stringify({
                query: `mutation($settings: [VarInput!]!, $webhooks: [WebhookInput!]!, $templatesUrl: String!) {
                    updateSettings(settings: $settings)
                    updateWebhooks(webhooks: $webhooks)
                    updateTemplates(templatesUrl: $templatesUrl)
                }`,
                variables,
            }),
        })
            .then(checkStatus)
            .then(() => {
                setTimeout(() => {
                    notify({ type: 'success', title: intl.formatMessage({ id: 'Settings save' }) });
                    updateLoading(() => false);
                }, 1000);
            })
            .catch(({ message }) => {
                setTimeout(() => {
                    notify({ type: 'error', title: intl.formatMessage({ id: message }) });
                    updateLoading(() => false);
                }, 1000);
            });

        return true;
    };

    return (
        <div className="my-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
                    <div className="md:grid md:grid-cols-3 md:gap-6">
                        <div className="md:col-span-1">
                            <h3 className="text-lg font-medium leading-6 text-gray-900">{intl.formatMessage({ id: 'Admin settings' })}</h3>
                            <p className="mt-1 text-sm leading-5 text-gray-500">
                                {intl.formatMessage({ id: 'Set your admin settings' })}.
                            </p>
                        </div>
                        <div className="mt-5 md:mt-0 md:col-span-2">
                            <div className="grid grid-cols-2 gap-6">
                                <AdminSettingsList />
                                <AdminSettingsWebhooks />
                            </div>
                        </div>
                    </div>
                    <div className="mt-8 border-t border-gray-200 pt-5">
                        <div className="flex justify-end">
                            <span className="ml-3 inline-flex rounded-md shadow-sm">
                                { isLoading ? (
                                    <button
                                        className="inline-flex items-center group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-gray-600 hover:bg-gray-500 focus:outline-none focus:border-gray-700 focus:shadow-outline-gray active:bg-gray-700 transition duration-150 ease-in-out"
                                        type="submit"
                                    >
                                        <span className="w-4 h-4 mr-2">
                                            <img src={`${withPrefix('/spinner.svg')}`} alt="spinner" className="spinner" />
                                        </span>
                                        {intl.formatMessage({ id: 'Save in progress...' })}
                                    </button>
                                ) : (
                                    <button
                                        type="submit"
                                        className="inline-flex justify-center py-2 px-4 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-gray-600 hover:bg-gray-500 focus:outline-none focus:border-gray-700 focus:shadow-outline-gray active:bg-gray-700 transition duration-150 ease-in-out"
                                        onClick={handleSubmit}
                                    >
                                        {intl.formatMessage({ id: 'Save' })}
                                    </button>
                                ) }
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});
