import React, { useState } from 'react';
import { useIntl } from 'gatsby-plugin-intl';
import { useRecoilValue } from 'recoil';

import { applicationEnvsSelector } from '../atoms';

export default ({ application, onClose }) => {
    const intl = useIntl();
    const { name, releaseName, price, domain, description, adminPath, logo } = application;

    const [passwordDisplayed, updatePassword] = useState(false);

    const togglePassword = () => updatePassword(!passwordDisplayed);

    const applicationEnvs = useRecoilValue(applicationEnvsSelector(releaseName));

    return (
        <div className="fixed bottom-0 inset-x-0 px-4 pb-6 sm:inset-0 sm:p-0 sm:flex sm:items-center sm:justify-center z-30">
            <div className="fixed inset-0 transition-opacity">
                <div className="absolute inset-0 bg-gray-500 opacity-75" />
            </div>

            <div className="bg-white rounded-lg shadow-xl transform transition-all sm:max-w-lg sm:w-full overflow-auto max-h-80" role="dialog" aria-modal="true" aria-labelledby="modal-headline">
                <div className="p-6">
                    <div className="grid grid-cols-3">
                        <div className="col-span-2">
                            <h3 className="text-lg font-medium leading-6 text-gray-900">{name}</h3>
                            <p className="mt-1 text-sm leading-5 text-gray-500">{description}</p>
                            <a href={`https://${domain}${adminPath || ''}`} target="_blank" className="text-sm font-medium text-gray-500 underline break-all block mt-4">
                                https://{domain}{adminPath}
                            </a>
                        </div>
                        <div className="text-right">
                            <div className="flex justify-end">
                                <img src={logo} alt="logo" className="w-14 h-14" />
                            </div>
                            <p className="text-sm"><b>{price}€ / mois</b></p>
                        </div>
                    </div>

                    <div className="grid gap-2 my-4">
                        { applicationEnvs.map((env) => {
                            return (
                                <div key={env.name} className="mt-2">
                                    <label htmlFor={env.name} className="block text-sm font-medium leading-5 text-gray-700">{env.label}</label>
                                    { env.type === 'select' ? (
                                        <select
                                            id={env.name}
                                            name={env.name}
                                            value={env.value}
                                            className="mt-1 block form-select w-full transition duration-150 ease-in-out sm:text-sm sm:leading-5 appearance-none"
                                            style={{ WebkitAppearance: 'none' }}
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
                                                        className={`form-input block w-full rounded-md transition duration-150 ease-in-out sm:text-sm sm:leading-5 ${env.disabled && 'bg-gray-200'}`}
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
                                                    className={`form-input block w-full rounded-md transition duration-150 ease-in-out sm:text-sm sm:leading-5 ${env.disabled && 'bg-gray-200 cursor-not-allowed'}`}
                                                />
                                            ) }
                                        </div>
                                    ) }
                                </div>
                            );
                        }) }
                    </div>

                    <div className={`mt-6 gap-2 grid ${applicationEnvs.length ? 'sm:grid-cols-2' : ''}`}>
                        <span className="flex w-full rounded-md shadow-sm">
                            <button
                                type="button"
                                onClick={onClose}
                                className="inline-flex justify-center w-full rounded-md border border-gray-300 px-4 py-2 bg-white text-base leading-6 font-medium text-gray-700 shadow-sm hover:text-gray-500 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue transition ease-in-out duration-150 sm:text-sm sm:leading-5"
                            >
                                {intl.formatMessage({ id: 'Cancel' })}
                            </button>
                        </span>
                        { applicationEnvs.length > 0 && (
                            <span className="relative flex w-full rounded-md shadow-sm">
                                <button
                                    type="button"
                                    className="inline-flex justify-center w-full rounded-md border border-transparent px-4 py-2 bg-gray-600 text-base leading-6 font-medium text-white shadow-sm hover:bg-gray-500 focus:outline-none focus:border-gray-700 focus:shadow-outline-gray transition ease-in-out duration-150 sm:text-sm sm:leading-5 opacity-50 cursor-not-allowed"
                                >
                                    {intl.formatMessage({ id: 'Update (Coming soon)' })}
                                </button>
                            </span>
                        ) }
                    </div>
                </div>
            </div>
        </div>
    );
};
