import React, { useEffect, useState } from 'react';
import { Link, withPrefix } from 'gatsby';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { useIntl } from 'gatsby-plugin-intl';

import { withNotifier } from '../context/NotificationContext';
import { STATES, checkStatus, getToken, remainingTimePercentage } from '../utils';
import { applicationsState } from '../atoms';
import GridIcon from '../images/grid.svg';
import DeleteIcon from '../images/delete.svg';
import EditIcon from '../images/edit.svg';
import EditModal from './editModal';
import AppDropdown from './appDropdown';

const INTERVAL = process.env.NODE_ENV === 'production' ? 5000 : 2000;

export default withNotifier(({ notify }) => {
    const intl = useIntl();

    const [editModal, updateEditModal] = useState(false);
    const applications = useRecoilValue(applicationsState);
    const [selectedApplication, selectApplication] = useState();
    const updateApplications = useSetRecoilState(applicationsState);

    const openEditModal = (app) => {
        selectApplication(app);
        updateEditModal(true);
    };

    const closeEditModal = () => updateEditModal(false);

    const loadData = () => {
        fetch(withPrefix('/graphql'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-access-token': getToken() },
            body: JSON.stringify({ query: `{
                applications { name, description, releaseName, category, logo, task, state, error, adminPath, price, domain, lastTaskDate }
            }` }),
        })
            .then(checkStatus)
            .then(({ data }) => {
                updateApplications(data.applications.sort((a, b) => a.name.localeCompare(b.name)));
            });
    };

    const uninstallApplication = async (releaseName) => {
        await fetch(withPrefix('/graphql'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-access-token': getToken() },
            body: JSON.stringify({ query: `mutation {
                uninstallApplication(releaseName: "${releaseName}")
            }` }),
        })
            .then(checkStatus)
            .catch(({ message }) => {
                console.error(message);
            });
    };

    useEffect(() => {
        const loadInterval = setInterval(loadData, INTERVAL);
        return () => clearInterval(loadInterval);
    }, []);

    if (!applications.length) {
        return (
            <div className="min-h-full flex items-center justify-center">
                <div className="flex flex-col justify-center">
                    <GridIcon className="w-24 m-auto text-gray-600" />
                    <h4 className="text-center text-2xl">{intl.formatMessage({ id: 'You have no applications' })}</h4>
                    <span className="rounded-md shadow-sm m-auto mt-3">
                        <Link
                            to="/"
                            className="inline-flex justify-center py-2 px-4 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-gray-600 hover:bg-gray-500 focus:outline-none focus:border-gray-700 focus:shadow-outline-gray active:bg-gray-700 transition duration-150 ease-in-out"
                        >
                            {intl.formatMessage({ id: 'Go to the store' })}
                        </Link>
                    </span>
                </div>
            </div>
        );
    }

    const percentage = (app) => {
        const maxTaskTime = app.state === STATES.INSTALLING ? 15 : 2;
        const lastTaskDate = new Date(app.lastTaskDate);
        const expiryTime = new Date(lastTaskDate.getTime() + maxTaskTime * 60 * 1000);
        return remainingTimePercentage(lastTaskDate.getTime(), expiryTime.getTime(), 10);
    };

    return (
        <>
            { editModal && <EditModal application={selectedApplication} onClose={closeEditModal} /> }
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                <h1 className="text-2xl font-semibold text-gray-900">{intl.formatMessage({ id: 'Applications' })}</h1>
                <p className="mt-1 text-sm text-gray-500">{intl.formatMessage({ id: 'Manage your applications easily' })}.</p>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 my-10">
                <div className="grid gap-3 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3 lg:gap-3 xl:grid-cols-4 xl:gap-4">
                    { applications.map((app) => (
                        <div className="bg-white shadow rounded-lg relative" key={app.releaseName}>
                            { app.error && (
                                <>
                                    <div className="absolute inset-0 flex items-center justify-center text-center opacity-75 bg-white rounded-lg z-20" />
                                    <div className="text-red-700 absolute inset-y-auto text-center w-full z-20" style={{ transform: 'translate(-50%, -50%)', top: '50%', left: '50%' }}>
                                        <h3 className="font-bold">{intl.formatMessage({ id: 'Error' })}: {intl.formatMessage({ id: app.error })}</h3>
                                        <a href={`https://${app.domain}`} target="_blank" className="text-sm font-medium text-gray-500 underline break-all domain">https://{app.domain}</a>
                                    </div>
                                </>
                            ) }

                            { !app.error && [STATES.UNINSTALLING, STATES.INSTALLING].includes(app.state) && (
                                <>
                                    <div className="absolute inset-0 flex items-center justify-center text-center opacity-75 bg-white z-20 rounded-lg" />
                                    <div className="text-gray-700 absolute inset-y-auto text-center w-full p-4 z-20" style={{ transform: 'translate(-50%, -50%)', top: '50%', left: '50%' }}>
                                        <h3 className="font-bold">
                                            <img src={`${withPrefix('/spinner-black.svg')}`} className="spinner w-4 inline-block mr-2" alt="spinner" />
                                            <span className="inline-block align-middle">{intl.formatMessage({ id: app.state })}</span>
                                        </h3>
                                        <div className="w-full bg-gray-300 rounded-md mt-2">
                                            <div
                                                className="bg-gray-500 text-xs leading-none py-1 text-center font-bold text-white rounded-md"
                                                style={{ width: `${percentage(app)}%` }}
                                            >
                                                {percentage(app)}%
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) }

                            <div className="flex flex-col min-h-full px-4 py-5 sm:p-6 lg:p-4">
                                <div className="flex-1">
                                    <div className="flex justify-between">
                                        <div>
                                            <h1 className="font-bold">{app.name}</h1>
                                            <h2 className="capitalize text-sm">{app.category}</h2>
                                        </div>
                                        <img src={app.logo} alt="logo" className="w-14 h-14" />
                                    </div>

                                    <div className={`pt-4 ${app.state === STATES.RUNNING ? '' : 'hidden'}`}>
                                        <a href={`https://${app.domain}`} target="_blank" className="text-sm font-medium text-gray-500 underline break-all domain">https://{app.domain}</a>
                                    </div>
                                </div>

                                <div className="relative inline-flex w-full mt-4 border-t border-gray-200 pt-5">
                                    <AppDropdown
                                        actions={[
                                            { text: intl.formatMessage({ id: 'Settings' }) },
                                            { text: intl.formatMessage({ id: 'Edit configuration' }), icon: <EditIcon className="w-5 h-5 mr-3 text-gray-500" fill="none" />, action: () => openEditModal(app) },
                                            { text: intl.formatMessage({ id: 'Uninstall application' }), action: () => notify({ type: 'confirm', title: 'Confirmation', message: intl.formatMessage({ id: 'Are you sure ?' }), onConfirm: () => uninstallApplication(app.releaseName) }), icon: <DeleteIcon className="w-5 h-5 mr-3 text-gray-500" /> },
                                        ]}
                                    />
                                </div>
                            </div>
                        </div>
                    )) }
                </div>
            </div>
        </>
    );
});
