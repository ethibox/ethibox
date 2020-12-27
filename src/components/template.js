import React, { useState } from 'react';
import { withPrefix } from 'gatsby';
import { useRecoilValue } from 'recoil';
import { useIntl } from 'gatsby-plugin-intl';

import InstallModal from './installModal';

import { getToken, checkStatus, navigate, autocast } from '../utils';
import { stripeState } from '../atoms';
import { withNotifier } from '../context/NotificationContext';

export default withNotifier((props) => {
    const intl = useIntl();
    const { notify } = props;
    const [modal, updateModal] = useState(false);
    const { stripeEnabled } = useRecoilValue(stripeState);

    const { template } = props;
    const { id: templateId, name, category, logo, website } = template;

    const openModal = () => updateModal(true);
    const closeModal = () => updateModal(false);

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
                notify({ type: 'error', title: intl.formatMessage({ id: message }) });
            });

        return response;
    };

    const handleClick = async () => {
        if (autocast(stripeEnabled)) {
            openModal();
        } else {
            await installApplication();
        }
    };

    return (
        <>
            { modal && <InstallModal template={template} onClose={closeModal} /> }
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

                        <a href={website} target="_blank" className="text-sm font-medium text-gray-500 underline break-all domain">{intl.formatMessage({ id: 'More infos' })}</a>
                    </div>

                    <div className="mt-8 border-t border-gray-200 pt-5">
                        <button
                            type="button"
                            onClick={handleClick}
                            className="inline-flex justify-center w-full rounded-md border border-gray-300 px-4 py-2 bg-white text-base leading-6 font-medium text-gray-700 shadow-sm hover:text-gray-500 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue transition ease-in-out duration-150 sm:text-sm sm:leading-5"
                        >
                            {intl.formatMessage({ id: 'Install application' })}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
});
