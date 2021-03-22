import React from 'react';
import { withPrefix } from 'gatsby';
import { CardElement, IbanElement, useStripe, useElements } from '@stripe/react-stripe-js';
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

    const { stripeEnabled, stripeClientSecret, stripeLast4, stripePaymentMethod } = useRecoilValue(stripeState);
    const updateStripe = useSetRecoilState(stripeState);

    const [isLoading, updateLoading] = useImmer(false);

    const [isIbanEnabled, toggleIban] = useImmer(stripePaymentMethod === 'iban');

    const saveIban = async () => {
        if (!autocast(stripeEnabled) || !isIbanEnabled) {
            return;
        }

        await stripe.confirmSepaDebitSetup(stripeClientSecret, {
            payment_method: {
                sepa_debit: elements.getElement(IbanElement),
                billing_details: { name: `${firstName} ${lastName}`, email },
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
    };

    const saveStripeCard = async () => {
        if (!autocast(stripeEnabled) || stripeLast4 || isIbanEnabled) {
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
            .then(saveIban)
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

                                { autocast(stripeEnabled) && !isIbanEnabled && (
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

                            <div className="pt-5 md:mt-0 md:col-span-2">
                                <div className="flex items-center justify-between">
                                    <span className="flex-grow flex flex-col" id="availability-label">
                                        <span className="text-sm font-medium text-gray-700">{intl.formatMessage({ id: 'Enable SEPA' })}</span>
                                        <span className="text-sm text-gray-500">{intl.formatMessage({ id: 'Check this case to enable SEPA Direct Debit payments' })}</span>
                                    </span>
                                    <button id="enable-iban" type="button" onClick={() => toggleIban(() => !isIbanEnabled)} className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isIbanEnabled ? 'bg-gray-600' : 'bg-gray-200'}`} aria-pressed="false" aria-labelledby="availability-label">
                                        <span className="sr-only">Use setting</span>
                                        <span aria-hidden="true" className={`translate-x-0 pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${isIbanEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                            </div>

                            { isIbanEnabled && (
                                <>
                                    { stripeLast4 ? (
                                        <div className="rounded-md bg-gray-50 px-6 py-5 sm:flex sm:items-center sm:justify-between">
                                            <div className="sm:flex sm:items-center">
                                                <svg className="SVGInline-svg SVGInline--cleaned-svg SVG-svg BrandIcon-svg BrandIcon--size--32-svg" height="32" width="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><g fill="none" fillRule="evenodd"><path d="M0 0h32v32H0z" fill="#10298d" /><path d="M27.485 18.42h-2.749l-.37 1.342H22.24L24.533 12h3.104l2.325 7.762h-2.083l-.393-1.342zm-.408-1.512l-.963-3.364-.936 3.364zm-10.452 2.854V12h3.83c.526 0 .928.044 1.203.13.63.202 1.052.612 1.27 1.233.111.325.167.816.167 1.47 0 .788-.06 1.354-.183 1.699-.247.68-.753 1.072-1.517 1.175-.09.015-.472.028-1.146.04l-.341.011H18.68v2.004zm2.056-3.805h1.282c.407-.015.653-.047.744-.096.12-.068.202-.204.242-.408.026-.136.04-.337.04-.604 0-.329-.026-.573-.079-.732-.073-.222-.25-.358-.53-.407a3.91 3.91 0 0 0-.4-.011h-1.299zm-10.469-1.48H6.3c0-.32-.038-.534-.11-.642-.114-.162-.43-.242-.942-.242-.5 0-.831.046-.993.139-.161.093-.242.296-.242.608 0 .283.072.469.215.558a.91.91 0 0 0 .408.112l.386.026c.517.033 1.033.072 1.55.119.654.066 1.126.243 1.421.53.231.222.37.515.414.875.025.216.037.46.037.73 0 .626-.057 1.083-.175 1.374-.213.532-.693.868-1.437 1.009-.312.06-.788.089-1.43.089-1.072 0-1.819-.064-2.24-.196-.517-.158-.858-.482-1.024-.969-.092-.269-.137-.72-.137-1.353h1.914v.162c0 .337.096.554.287.65.13.067.29.101.477.106h.704c.359 0 .587-.019.687-.056a.57.57 0 0 0 .346-.34 1.38 1.38 0 0 0 .044-.374c0-.341-.123-.55-.368-.624-.092-.03-.52-.071-1.28-.123a15.411 15.411 0 0 1-1.274-.128c-.626-.119-1.044-.364-1.252-.736-.184-.315-.275-.793-.275-1.432 0-.487.05-.877.148-1.17.1-.294.258-.517.48-.669.321-.234.735-.371 1.237-.412.463-.04.927-.058 1.391-.056.803 0 1.375.046 1.717.14.833.227 1.248.863 1.248 1.909a5.8 5.8 0 0 1-.018.385z" fill="#fff" /><path d="M13.786 13.092c.849 0 1.605.398 2.103 1.02l.444-.966a3.855 3.855 0 0 0-2.678-1.077c-1.62 0-3.006.995-3.575 2.402h-.865l-.51 1.111h1.111c-.018.23-.017.46.006.69h-.56l-.51 1.111h1.354a3.853 3.853 0 0 0 3.549 2.335c.803 0 1.55-.244 2.167-.662v-1.363a2.683 2.683 0 0 1-2.036.939 2.7 2.7 0 0 1-2.266-1.248h2.832l.511-1.112h-3.761a2.886 2.886 0 0 1-.016-.69h4.093l.51-1.11h-4.25a2.704 2.704 0 0 1 2.347-1.38" fill="#ffcc02" /></g></svg>
                                                <div className="mt-3 sm:mt-0 sm:ml-4">
                                                    <div className="text-sm leading-5 font-medium text-gray-900">
                                                        Ending with {stripeLast4}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-4 sm:mt-0 sm:ml-6 sm:flex-shrink-0">
                                                <span className="inline-flex rounded-md shadow-sm">
                                                    <button onClick={() => notify({ type: 'confirm', title: 'Confirmation', message: intl.formatMessage({ id: 'Are you sure ?' }), onConfirm: () => removePaymentMethod() })} type="button" id="change_card" className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:text-gray-500 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue active:text-gray-800 active:bg-gray-50 transition ease-in-out duration-150">
                                                        {intl.formatMessage({ id: 'Change iban' })}
                                                    </button>
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <IbanElement options={{ supportedCountries: ['SEPA'] }} className="mt-1 form-input block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition duration-150 ease-in-out sm:text-sm sm:leading-5" />
                                    ) }
                                </>
                            ) }

                        </div>
                    </div>
                    <div className="mt-8 border-t border-gray-200 pt-5">
                        <div className="flex justify-end">
                            <button type="button" className="focus:outline-none" onClick={() => openModal({ content: modalContent, confirmButton: intl.formatMessage({ id: 'Delete account' }), confirmClass: 'bg-red-700 hover:bg-red-800', onConfirm: deleteAccount })}>{intl.formatMessage({ id: 'Delete account' })}</button>
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
