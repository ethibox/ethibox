import React, { useState } from 'react';
import { useIntl } from 'gatsby-plugin-intl';
import { useRecoilState } from 'recoil';
import { useImmer } from 'use-immer';
import { withPrefix } from 'gatsby';
import { isFQDN } from 'validator';

import { getToken, checkStatus } from '../utils';
import { applicationEnvsSelector } from '../atoms';
import { withNotifier } from '../context/NotificationContext';

export default withNotifier(({ application, onClose, notify }) => {
    const intl = useIntl();
    const [applicationEnvs, setApplicationEnvs] = useRecoilState(applicationEnvsSelector(application.releaseName));
    const [app, updateApplication] = useImmer({ ...application, envs: applicationEnvs, domain: application.domain, ip: null, error: false, success: false });
    const [isLoading, updateLoading] = useImmer(false);
    const [passwordDisplayed, updatePassword] = useState(false);

    const togglePassword = () => updatePassword(!passwordDisplayed);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const { releaseName, envs, domain } = app;

        updateLoading(() => true);

        if (!isFQDN(domain)) {
            updateLoading(() => false);
            const error = 'Nom de domaine invalide';
            notify({ type: 'error', title: intl.formatMessage({ id: error }) });
            updateApplication((draft) => { draft.error = error; });
            return;
        }

        const variables = {
            envs: envs.map(({ id, name, value }) => ({ id, name, value })),
        };

        await fetch(withPrefix('/graphql'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-access-token': getToken() },
            body: JSON.stringify({
                query: `mutation($envs: [VarInput!]!) {
                    updateApplication(releaseName: "${releaseName}", domain: "${domain}", envs: $envs)
                }`,
                variables,
            }),
        })
            .then(checkStatus)
            .then(() => {
                updateLoading(() => false);
                setApplicationEnvs(envs);
                notify({ type: 'success', title: intl.formatMessage({ id: 'Configuration edited with success' }) });
                onClose();
            })
            .catch(({ message, extensions }) => {
                const ip = (extensions && extensions.exception.ip) || null;
                notify({ type: 'error', title: intl.formatMessage({ id: message }, { domain, ip }) });
                updateLoading(() => false);
                updateApplication((draft) => {
                    draft.error = message;
                    draft.ip = ip;
                });
            });
    };

    const { envs, description, logo, domain, error, ip } = app;

    return (
        <div className="fixed bottom-0 inset-x-0 px-4 pb-6 sm:inset-0 sm:p-0 sm:flex sm:items-center sm:justify-center z-30">
            <div className="fixed inset-0 transition-opacity">
                <div className="absolute inset-0 bg-gray-500 opacity-75" />
            </div>

            <div className="bg-white rounded-lg shadow-xl transform transition-all sm:max-w-lg sm:w-full overflow-auto max-h-80" role="dialog" aria-modal="true" aria-labelledby="modal-headline">
                <div className="p-6">
                    <div className="grid grid-cols-3">
                        <div className="col-span-2">
                            <h3 className="text-lg font-medium leading-6 text-gray-900">{app.name}</h3>
                            <p className="mt-1 text-sm leading-5 text-gray-500">{description}</p>
                        </div>
                        <div className="text-right">
                            <div className="flex justify-end">
                                <img src={logo} alt="logo" className="w-14 h-14" />
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-2 my-4">
                        <div className="mt-2">
                            <label htmlFor="update_domain" className="block text-sm font-medium leading-5 text-gray-700">Nom de domaine</label>
                            <div className="mt-1 flex rounded-md shadow-sm">
                                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                                    https://
                                </span>
                                <input
                                    id="update_domain"
                                    type="text"
                                    name="domain"
                                    value={domain}
                                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md focus:ring-gray-300 focus:border-gray-300 sm:text-sm border border-gray-300 focus:outline-none focus:shadow-outline-none focus:ring-0 focus:border-gray-300"
                                    placeholder="mondomaine.fr"
                                    onChange={(e) => {
                                        const { value } = e.target;
                                        updateApplication((draft) => {
                                            draft.error = false;
                                            draft.domain = value;
                                        });
                                    }}
                                />
                            </div>
                        </div>
                        { envs.map((env, index) => {
                            return (
                                <div key={env.name} className="mt-2">
                                    <label htmlFor={env.name} className="block text-sm font-medium leading-5 text-gray-700">{env.label}</label>
                                    { env.type === 'select' ? (
                                        <select
                                            id={env.name}
                                            name={env.name}
                                            value={env.value}
                                            className="mt-1 w-full transition duration-150 ease-in-out sm:text-sm sm:leading-5 rounded appearance-none border-gray-300 focus:outline-none focus:shadow-outline-none focus:ring-0 focus:border-gray-300"
                                            style={{ WebkitAppearance: 'none' }}
                                            onChange={(e) => {
                                                const { value } = e.target;
                                                updateApplication((draft) => {
                                                    draft.envs[index].value = value;
                                                    draft.error = false;
                                                });
                                            }}
                                        >
                                            { env.select.map((s) => (
                                                <option value={s.value}>{s.text}</option>
                                            )) }
                                        </select>
                                    ) : (
                                        <div className="mt-1 relative rounded-md shadow-sm">
                                            { env.type === 'password' ? (
                                                <>
                                                    <input
                                                        name={env.name}
                                                        disabled={env.disabled}
                                                        value={env.value}
                                                        type={passwordDisplayed ? 'text' : 'password'}
                                                        className={`w-full rounded-md transition duration-150 ease-in-out sm:text-sm sm:leading-5 border-gray-300 focus:outline-none focus:shadow-outline-none focus:ring-0 focus:border-gray-300 ${env.disabled && 'bg-gray-200'}`}
                                                        onChange={(e) => {
                                                            const { value } = e.target;
                                                            updateApplication((draft) => {
                                                                draft.envs[index].value = value;
                                                                draft.error = false;
                                                            });
                                                        }}
                                                    />
                                                    { env.value && (
                                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                                            <button type="button" className="focus:outline-none" onClick={togglePassword}>
                                                                <label
                                                                    className="bg-gray-300 hover:bg-gray-400 rounded px-2 py-1 text-sm text-gray-600 cursor-pointer"
                                                                    htmlFor="toggle"
                                                                >
                                                                    {passwordDisplayed ? intl.formatMessage({ id: 'hide' }) : intl.formatMessage({ id: 'show' })}
                                                                </label>
                                                            </button>
                                                        </div>
                                                    ) }
                                                </>
                                            ) : (
                                                <input
                                                    name={env.name}
                                                    disabled={env.disabled}
                                                    value={env.value}
                                                    type={env.type || 'text'}
                                                    className={`w-full rounded-md transition duration-150 ease-in-out sm:text-sm sm:leading-5 border-gray-300 focus:outline-none focus:shadow-outline-none focus:ring-0 focus:border-gray-300 ${env.disabled && 'bg-gray-200 cursor-not-allowed'}`}
                                                    onChange={(e) => {
                                                        const { value } = e.target;
                                                        updateApplication((draft) => {
                                                            draft.envs[index].value = value;
                                                            draft.error = false;
                                                        });
                                                    }}
                                                />
                                            ) }
                                        </div>
                                    ) }
                                </div>
                            );
                        }) }
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
                                className="inline-flex justify-center w-full rounded-md border border-gray-300 px-4 py-2 bg-white text-base leading-6 font-medium text-gray-700 shadow-sm hover:text-gray-500 focus:outline-none focus:border-gray-300 focus:shadow-outline-gray transition ease-in-out duration-150 sm:text-sm sm:leading-5"
                            >
                                {intl.formatMessage({ id: 'Cancel' })}
                            </button>
                        </span>
                        <span className="relative flex w-full rounded-md shadow-sm">
                            <button
                                type="button"
                                onClick={handleSubmit}
                                className="inline-flex justify-center w-full rounded-md border border-transparent px-4 py-2 bg-gray-600 text-base leading-6 font-medium text-white shadow-sm hover:bg-gray-500 focus:outline-none focus:border-gray-700 focus:shadow-outline-gray transition ease-in-out duration-150 sm:text-sm sm:leading-5"
                            >
                                { isLoading ? (
                                    <>
                                        <span className="w-4 h-4">
                                            <img src={`${withPrefix('/spinner.svg')}`} alt="spinner" className="spinner" />
                                        </span>
                                    </>
                                ) : (
                                    <span>{intl.formatMessage({ id: 'Update' })}</span>
                                ) }
                            </button>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
});
