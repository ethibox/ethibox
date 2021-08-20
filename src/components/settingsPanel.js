import React from 'react';
import { withPrefix } from 'gatsby';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { useIntl } from 'gatsby-plugin-intl';
import { useImmer } from 'use-immer';

import { checkStatus, getToken, redirect, autocast } from '../utils';
import { withNotifier } from '../context/NotificationContext';
import { withModal } from '../context/ModalContext';
import { userState, stripeState } from '../atoms';

export default withNotifier(withModal(({ notify, openModal }) => {
    const intl = useIntl();
    const stripe = useStripe();
    const elements = useElements();

    const { email, firstName, lastName } = useRecoilValue(userState);
    const updateUser = useSetRecoilState(userState);

    const { stripeEnabled, stripeClientSecret, stripeLast4 } = useRecoilValue(stripeState);
    const updateStripe = useSetRecoilState(stripeState);

    const [isLoading, updateLoading] = useImmer(false);

    const saveStripeCard = async () => {
        if (!autocast(stripeEnabled) || stripeLast4) {
            return;
        }

        await stripe.confirmCardSetup(stripeClientSecret, {
            payment_method: {
                card: elements.getElement(CardElement),
                billing_details: { name: `${firstName} ${lastName}` },
            },
        }).then((data) => {
            if (data.error) {
                throw new Error(data.error.message);
            }

            return data.setupIntent.payment_method;
        }).then(async (paymentMethodId) => {
            await fetch(withPrefix('/graphql'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-access-token': getToken() },
                body: JSON.stringify({ query: `mutation {
                    updateDefaultPaymentMethod(paymentMethodId: "${paymentMethodId}")
                }` }),
            });
        }).catch(({ message }) => {
            throw new Error(message);
        });

        updateStripe((s) => ({ ...s, stripeLast4: '****' }));
        updateLoading(() => false);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        updateUser((user) => ({ ...user, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!firstName) {
            notify({ type: 'error', title: intl.formatMessage({ id: 'Please enter your first name' }) });
            return;
        }

        if (!lastName) {
            notify({ type: 'error', title: intl.formatMessage({ id: 'Please enter your last name' }) });
            return;
        }

        updateLoading(() => true);

        await fetch(withPrefix('/graphql'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-access-token': getToken() },
            body: JSON.stringify({ query: `mutation {
                updateUser(firstName: "${firstName}", lastName: "${lastName}")
            }` }),
        })
            .then(checkStatus)
            .then(saveStripeCard)
            .then(() => {
                notify({ type: 'success', title: intl.formatMessage({ id: 'Account informations saved successfully' }) });
            })
            .catch(({ message }) => {
                notify({ type: 'error', title: intl.formatMessage({ id: message }) });
            })
            .finally(() => {
                updateLoading(() => false);
            });
    };

    const removePaymentMethod = async () => {
        updateLoading(() => true);

        await fetch(withPrefix('/graphql'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-access-token': getToken() },
            body: JSON.stringify({ query: `mutation {
                removePaymentMethod
            }` }),
        }).then(() => {
            redirect('/settings');
        });
    };

    const modalContent = (
        <>
            <p className="font-bold mb-4 text-xl">{intl.formatMessage({ id: 'Confirm Account Deletion' })}</p>
            <p className="my-2">{intl.formatMessage({ id: 'By deleting your user account, you will also delete all applications and cancel any billing associated with them' })}.</p>
            <p className="my-2 font-bold">{intl.formatMessage({ id: 'Are you sure you want to delete your account? There’s no coming back from this!' })}</p>
        </>
    );

    const deleteAccount = async () => {
        await fetch(withPrefix('/graphql'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-access-token': getToken() },
            body: JSON.stringify({ query: `mutation {
                deleteAccount
            }` }),
        }).then(() => {
            redirect('/logout');
        });
    };

    return (
        <div className="mt-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
                    <div className="md:grid md:grid-cols-3 md:gap-6">
                        <div className="md:col-span-1">
                            <h3 className="text-lg font-medium leading-6 text-gray-900">{intl.formatMessage({ id: 'Account informations' })}</h3>
                            <p className="mt-1 text-sm leading-5 text-gray-500">
                                {intl.formatMessage({ id: 'Change your name, email & payment method' })}.
                            </p>
                        </div>
                        <div className="mt-5 md:mt-0 md:col-span-2">
                            <div className="grid grid-cols-6 gap-6">
                                <div className="col-span-6">
                                    <label htmlFor="email_address" className="block text-sm font-medium leading-5 text-gray-700">{intl.formatMessage({ id: 'Email address' })}</label>
                                    <input
                                        id="email_address"
                                        className="mt-1 form-input block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition duration-150 ease-in-out sm:text-sm sm:leading-5 bg-gray-200"
                                        value={email}
                                        name="email"
                                        onChange={handleChange}
                                        disabled
                                    />
                                </div>

                                <div className="col-span-6 sm:col-span-3">
                                    <label htmlFor="first_name" className="block text-sm font-medium leading-5 text-gray-700">{intl.formatMessage({ id: 'First name' })}</label>
                                    <input
                                        id="first_name"
                                        className="mt-1 form-input block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition duration-150 ease-in-out sm:text-sm sm:leading-5"
                                        name="firstName"
                                        value={firstName || ''}
                                        placeholder="John"
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="col-span-6 sm:col-span-3">
                                    <label htmlFor="last_name" className="block text-sm font-medium leading-5 text-gray-700">{intl.formatMessage({ id: 'Last name' })}</label>
                                    <input
                                        id="last_name"
                                        className="mt-1 form-input block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition duration-150 ease-in-out sm:text-sm sm:leading-5"
                                        name="lastName"
                                        placeholder="Doe"
                                        value={lastName || ''}
                                        onChange={handleChange}
                                    />
                                </div>

                                { autocast(stripeEnabled) && (
                                    <>
                                        { stripeLast4 ? (
                                            <div className="col-span-6">
                                                <label htmlFor="card" className="block text-sm font-medium leading-5 text-gray-700">{intl.formatMessage({ id: 'Card number' })}</label>
                                                <div className="rounded-md bg-gray-50 px-6 py-5 sm:flex sm:items-center sm:justify-between">
                                                    <div className="sm:flex sm:items-center">
                                                        <svg className="h-8 w-auto sm:flex-shrink-0 sm:h-6" fill="none" viewBox="0 0 36 24" role="img" aria-labelledby="svg-visa">
                                                            <title id="svg-visa">VISA
                                                            </title>
                                                            <rect width="36" height="24" fill="#224DBA" rx="4" />
                                                            <path fill="#fff" fillRule="evenodd" d="M10.925 15.673H8.874l-1.538-6c-.073-.276-.228-.52-.456-.635A6.575 6.575 0 005 8.403v-.231h3.304c.456 0 .798.347.855.75l.798 4.328 2.05-5.078h1.994l-3.076 7.5zm4.216 0h-1.937L14.8 8.172h1.937l-1.595 7.5zm4.101-5.422c.057-.404.399-.635.798-.635a3.54 3.54 0 011.88.346l.342-1.615A4.808 4.808 0 0020.496 8c-1.88 0-3.248 1.039-3.248 2.481 0 1.097.969 1.673 1.653 2.02.74.346 1.025.577.968.923 0 .519-.57.75-1.139.75a4.795 4.795 0 01-1.994-.462l-.342 1.616a5.48 5.48 0 002.108.404c2.108.057 3.418-.981 3.418-2.539 0-1.962-2.678-2.077-2.678-2.942zm9.457 5.422L27.16 8.172h-1.652a.858.858 0 00-.798.577l-2.848 6.924h1.994l.398-1.096h2.45l.228 1.096h1.766zm-2.905-5.482l.57 2.827h-1.596l1.026-2.827z" clipRule="evenodd" />
                                                        </svg>
                                                        <div className="mt-3 sm:mt-0 sm:ml-4">
                                                            <div className="text-sm leading-5 font-medium text-gray-900">
                                                                Ending with {stripeLast4}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="mt-4 sm:mt-0 sm:ml-6 sm:flex-shrink-0">
                                                        <span className="inline-flex rounded-md shadow-sm">
                                                            <button onClick={() => notify({ type: 'confirm', title: 'Confirmation', message: intl.formatMessage({ id: 'Are you sure ?' }), onConfirm: () => removePaymentMethod() })} type="button" id="change_card" className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:text-gray-500 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue active:text-gray-800 active:bg-gray-50 transition ease-in-out duration-150">
                                                                {intl.formatMessage({ id: 'Change card' })}
                                                            </button>
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="col-span-6 sm:col-span-3">
                                                <label htmlFor="card" className="block text-sm font-medium leading-5 text-gray-700">{intl.formatMessage({ id: 'Card number' })}</label>
                                                <CardElement id="card" className="mt-1 form-input block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition duration-150 ease-in-out sm:text-sm sm:leading-5" />
                                            </div>
                                        ) }
                                    </>
                                ) }
                            </div>
                        </div>
                    </div>
                    <div className="mt-8 border-t border-gray-200 pt-5">
                        <div className="flex justify-end">
                            <button
                                type="button"
                                className="focus:outline-none"
                                onClick={() => openModal({
                                    content: modalContent,
                                    confirmButton: intl.formatMessage({ id: 'Delete account' }),
                                    confirmClass: 'bg-red-700 hover:bg-red-800',
                                    onConfirm: deleteAccount,
                                    closeButton: intl.formatMessage({ id: 'Cancel' }),
                                })}
                            >
                                {intl.formatMessage({ id: 'Delete account' })}
                            </button>
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
}));
