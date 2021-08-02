import React, { useEffect } from 'react';
import { useImmer } from 'use-immer';
import { useRecoilValue, useSetRecoilState } from 'recoil';

import { adminSettingsState } from '../atoms';
import { EVENTS, capitalize } from '../utils';

import TrashIcon from '../images/trash.svg';
import PlusIcon from '../images/plus-circle.svg';

export default () => {
    const adminSettings = useRecoilValue(adminSettingsState);
    const updateAdminSettings = useSetRecoilState(adminSettingsState);
    const [webhooks, updateWebhooks] = useImmer(adminSettings.webhooks);

    useEffect(() => {
        updateAdminSettings((settings) => ({ ...settings, webhooks }));
    }, [webhooks]);

    const events = [
        EVENTS.INSTALL,
        EVENTS.UNINSTALL,
        EVENTS.UPDATE,
        EVENTS.RESETPASSWORD,
        EVENTS.REGISTER,
        EVENTS.UNSUBSCRIBE,
    ];

    return (
        <>
            <div className="col-span-2">
                <label htmlFor="webhooks" className="block text-sm font-medium leading-5 text-gray-700">
                    Webhooks
                    <button
                        type="button"
                        onClick={() => {
                            updateWebhooks((draft) => {
                                draft.push({ id: webhooks.length, event: events[0], targetUrl: '' });
                            });
                        }}
                        className="inline-flex items-center relative justify-center px-2 border border-gray-300 rounded-md ml-2 focus:outline-none"
                    >
                        <PlusIcon className="w-3 text-gray-800" />
                        <span className="ml-2">Add webhook</span>
                    </button>
                </label>
                { webhooks.map((webhook, index) => {
                    return (
                        <div key={webhook.id} className="grid gap-1 grid-cols-11 mt-2">
                            <div className="col-span-11 sm:col-span-5 flex rounded-md shadow-sm">
                                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">Event</span>
                                <select
                                    value={webhook.event}
                                    onChange={(e) => {
                                        const { value } = e.target;
                                        updateWebhooks((draft) => {
                                            draft[index].event = value;
                                        });
                                    }}
                                    className="rounded-l-none block form-select w-full transition duration-150 ease-in-out sm:text-sm sm:leading-5 appearance-none"
                                    style={{ WebkitAppearance: 'none' }}
                                >
                                    { events.map((event) => (
                                        <option key={Math.random()} value={event}>{capitalize(event).replace('_', ' ')}</option>
                                    )) }
                                </select>
                            </div>
                            <div className="col-span-11 sm:col-span-5 flex rounded-md shadow-sm">
                                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">Target URL</span>
                                <input
                                    value={webhook.targetUrl}
                                    onChange={(e) => {
                                        const { value } = e.target;
                                        updateWebhooks((draft) => {
                                            draft[index].targetUrl = value;
                                        });
                                    }}
                                    className="flex-1 form-input block w-full rounded-none rounded-r-md transition duration-150 ease-in-out sm:text-sm sm:leading-5"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    updateWebhooks((draft) => {
                                        draft.splice(draft.findIndex((w) => w.id === webhook.id), 1);
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
