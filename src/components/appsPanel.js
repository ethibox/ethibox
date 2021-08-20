import React, { useEffect, useState } from 'react';
import { withPrefix } from 'gatsby';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { useLocation } from '@reach/router';
import { Link, useIntl } from 'gatsby-plugin-intl';
import Confetti from 'react-confetti';
import queryString from 'query-string';

import { withModal } from '../context/ModalContext';
import { STATES, checkStatus, getToken, remainingTimePercentage, navigate } from '../utils';
import { applicationsState } from '../atoms';
import GridIcon from '../images/grid.svg';
import DeleteIcon from '../images/delete.svg';
import EditIcon from '../images/edit.svg';
import EditModal from './editModal';
import AppDropdown from './appDropdown';

const INTERVAL = process.env.NODE_ENV === 'production' ? 5000 : 2000;
const MAX_TASK_TIME = process.env.MAX_TASK_TIME || 15;

export default withModal(({ openModal }) => {
    const intl = useIntl();
    const location = useLocation();

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
                applications { name, description, releaseName, category, logo, task, state, error, adminPath, domain, lastTaskDate }
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

    const installApplication = async ({ sessionId }) => {
        const response = await fetch(withPrefix('/graphql'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-access-token': getToken() },
            body: JSON.stringify({ query: `mutation {
                installApplication(sessionId: "${sessionId}")
            }` }),
        })
            .then(checkStatus)
            .then(() => {
                return true;
            })
            .catch(() => {
                return false;
            });

        return response;
    };

    const { session_id: sessionId } = queryString.parse(location.search);

    useEffect(() => {
        async function install() {
            if (sessionId) {
                navigate('/apps');
                await installApplication({ sessionId });

                openModal({
                    closeButton: 'Close',
                    content: (
                        <>
                            <Confetti width={500} height={200} recycle={false} />
                            <p className="font-bold mb-4 text-xl">{intl.formatMessage({ id: 'Congratulations! 🎉' })}</p>
                            <p className="my-2">{intl.formatMessage({ id: 'The installation of your application is in progress' })}.</p>
                        </>
                    ),
                });
            }
        }
        install();
    }, [sessionId]);

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

    const modalContent = (
        <>
            <p className="font-bold mb-4 text-xl">{intl.formatMessage({ id: 'Confirm Application Deletion' })}</p>
            <p className="my-2">{intl.formatMessage({ id: 'By deleting your application, you will also delete all your application\'s data and cancel your billing associated' })}.</p>
            <p className="my-2 font-bold">{intl.formatMessage({ id: 'Are you sure you want to delete your application?' })}</p>
        </>
    );

    const percentage = (app) => {
        const lastTaskDate = new Date(app.lastTaskDate);
        const expiryTime = new Date(lastTaskDate.getTime() + MAX_TASK_TIME * 60 * 1000);
        return remainingTimePercentage(lastTaskDate.getTime(), expiryTime.getTime());
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
                            { app.state === STATES.STANDBY && (
                                <>
                                    <div className="absolute inset-0 flex items-center justify-center text-center opacity-75 bg-white z-10 rounded-lg" />
                                    <div className="text-gray-700 absolute inset-y-auto text-center w-full p-4 z-10" style={{ transform: 'translate(-50%, -50%)', top: '50%', left: '50%' }}>
                                        <h3 className="font-bold">
                                            <img src={`${withPrefix('/spinner-black.svg')}`} className="spinner w-4 inline-block mr-2" alt="spinner" />
                                            <span className="inline-block align-middle">{intl.formatMessage({ id: 'Action in progress' })}</span>
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
                                            <h1 className="font-bold">
                                                <span>{app.name}</span>
                                                { app.state === STATES.OFFLINE && (
                                                    <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                                        <svg className="mr-1.5 h-2 w-2 text-red-400" fill="currentColor" viewBox="0 0 8 8">
                                                            <circle cx="4" cy="4" r="3" />
                                                        </svg>
                                                        { intl.formatMessage({ id: 'Offline' }) }
                                                    </span>
                                                ) }
                                            </h1>
                                            <h2 className="capitalize text-sm">{app.category}</h2>
                                        </div>
                                        <img src={app.logo} alt="logo" className="w-14 h-14" />
                                    </div>

                                    <div className="pt-4">
                                        <a href={`https://${app.domain}`} target="_blank" className="text-sm font-medium text-gray-500 underline break-all domain">https://{app.domain}</a>
                                    </div>
                                </div>

                                <div className="relative inline-flex w-full mt-4 border-t border-gray-200 pt-5">
                                    <AppDropdown
                                        actions={[
                                            { text: intl.formatMessage({ id: 'Settings' }) },
                                            {
                                                text: intl.formatMessage({ id: 'Edit configuration' }),
                                                icon: <EditIcon className="w-5 h-5 mr-3 text-gray-500" fill="none" />,
                                                action: () => openEditModal(app),
                                            },
                                            {
                                                text: intl.formatMessage({ id: 'Uninstall application' }),
                                                icon: <DeleteIcon className="w-5 h-5 mr-3 text-gray-500" />,
                                                action: () => openModal({
                                                    content: modalContent,
                                                    onConfirm: () => uninstallApplication(app.releaseName),
                                                    confirmButton: intl.formatMessage({ id: 'Uninstall application' }),
                                                    confirmClass: 'bg-red-700 hover:bg-red-800',
                                                    closeButton: intl.formatMessage({ id: 'Cancel' }),
                                                }),
                                            },
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
