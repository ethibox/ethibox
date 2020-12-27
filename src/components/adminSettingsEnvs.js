import React, { useEffect } from 'react';
import { useIntl } from 'gatsby-plugin-intl';
import { useImmer } from 'use-immer';

import { useRecoilValue, useSetRecoilState } from 'recoil';
import { adminSettingsState } from '../atoms';

import TrashIcon from '../images/trash.svg';
import PlusIcon from '../images/plus-circle.svg';

export default () => {
    const intl = useIntl();

    const adminSettings = useRecoilValue(adminSettingsState);
    const updateAdminSettings = useSetRecoilState(adminSettingsState);
    const [globalEnvs, updateGlobalEnvs] = useImmer(adminSettings.globalEnvs);

    useEffect(() => {
        updateAdminSettings((settings) => ({ ...settings, globalEnvs }));
    }, [globalEnvs]);

    return (
        <>
            <div className="col-span-2">
                <label htmlFor="main_ip" className="block text-sm font-medium leading-5 text-gray-700">
                    {intl.formatMessage({ id: 'Global environnement variables' })}
                    <button
                        type="button"
                        onClick={() => {
                            updateGlobalEnvs((draft) => {
                                draft.push({ id: globalEnvs.length, name: '', value: '' });
                            });
                        }}
                        className="inline-flex items-center relative justify-center px-2 border border-gray-300 rounded-md ml-2 focus:outline-none"
                    >
                        <PlusIcon className="w-3" />
                        <span className="ml-2">Add environment variable</span>
                    </button>
                </label>
                { globalEnvs.map((env, index) => {
                    return (
                        <div key={env.id} className="grid gap-1 grid-cols-11 mt-4 sm:mt-1">
                            <div className="col-span-11 sm:col-span-5 flex rounded-md shadow-sm">
                                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">Name</span>
                                <input
                                    value={env.name}
                                    onChange={(e) => {
                                        const name = e.target.value;
                                        updateGlobalEnvs((draft) => {
                                            draft[index].name = name;
                                        });
                                    }}
                                    className="flex-1 form-input block w-full rounded-none rounded-r-md transition duration-150 ease-in-out sm:text-sm sm:leading-5"
                                />
                            </div>
                            <div className="col-span-11 sm:col-span-5 flex rounded-md shadow-sm">
                                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">Value</span>
                                <input
                                    value={env.value}
                                    onChange={(e) => {
                                        const { value } = e.target;
                                        updateGlobalEnvs((draft) => {
                                            draft[index].value = value;
                                        });
                                    }}
                                    className="flex-1 form-input block w-full rounded-none rounded-r-md transition duration-150 ease-in-out sm:text-sm sm:leading-5"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    updateGlobalEnvs((draft) => {
                                        draft.splice(draft.findIndex((e) => e.id === env.id), 1);
                                    });
                                }}
                                className="col-span-11 sm:col-span-1 flex justify-center py-2 px-4 border border-gray-300 rounded-md text-sm leading-5 font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue active:bg-gray-50 active:text-gray-800 transition duration-150 ease-in-out"
                            >
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                    );
                }) }
            </div>
        </>
    );
};
