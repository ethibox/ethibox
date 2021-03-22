import React, { useState } from 'react';
import { useImmer } from 'use-immer';
import { Link, withPrefix } from 'gatsby';
import { useIntl } from 'gatsby-plugin-intl';
import { useRecoilValue } from 'recoil';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import ImageZoom from 'react-medium-image-zoom';

import { withNotifier } from '../context/NotificationContext';
import { userState, stripeState } from '../atoms';
import { getToken, checkStatus, navigate } from '../utils';

export default withNotifier((props) => {
    const intl = useIntl();
    const stripe = useStripe();
    const elements = useElements();

    const user = useRecoilValue(userState);
    const { stripeClientSecret, stripeLast4, stripePaymentMethod } = useRecoilValue(stripeState);
    const paymentExist = stripeLast4 || false;

    const { template, onClose, notify } = props;
    const { id: templateId, name, description, price, logo, screenshots, trial, website } = template;

    const [{ firstName, lastName }, updateUser] = useImmer(user);
    const [isLoading, updateLoading] = useState(false);

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
                throw new Error(message);
            });

        return response;
    };

    const updateCardInfo = async () => {
        const response = await stripe.confirmCardSetup(stripeClientSecret, {
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

        return response;
    };

    const handleChange = (e) => {
        const { name: n, value } = e.target;
        updateUser((draft) => { draft[n] = value; });
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
        }).catch(({ message }) => {
            notify({ type: 'error', title: intl.formatMessage({ id: message }) });
        });

        if (!paymentExist) {
            await updateCardInfo()
                .then(installApplication)
                .catch((message) => {
                    notify({ type: 'error', title: intl.formatMessage({ id: message }) });
                })
                .finally(() => {
                    updateLoading(() => false);
                });
        } else {
            await installApplication();
            updateLoading(() => false);
        }
    };

    return (
        <div className="fixed bottom-0 inset-x-0 px-4 pb-6 sm:inset-0 sm:p-0 sm:flex sm:items-center sm:justify-center z-30">
            <div className="fixed inset-0 transition-opacity">
                <div className="absolute inset-0 bg-gray-500 opacity-75" />
            </div>

            <div className="bg-white rounded-lg px-4 pt-5 pb-4 overflow-hidden shadow-xl transform transition-all sm:max-w-lg sm:w-full sm:p-6" role="dialog" aria-modal="true" aria-labelledby="modal-headline">
                <div className="grid grid-cols-3">
                    <div className="col-span-2">
                        <h3 className="text-lg font-medium leading-6 text-gray-900">{name}</h3>
                        <p className="mt-1 text-sm leading-5 text-gray-500">{description}</p>
                        <a href={website} target="_blank" className="text-sm inline-block mt-2 font-medium text-gray-500 underline break-all domain">{intl.formatMessage({ id: 'More infos' })}</a>
                        <div className="grid grid-cols-3 gap-2 mt-4">
                            { (screenshots || []).map((screenshot) => (
                                <ImageZoom
                                    key={screenshot}
                                    image={{ src: screenshot, alt: 'Screenshot', className: 'border w-18' }}
                                    defaultStyles={{ overlay: { backgroundColor: 'rgba(0, 0, 0, 0.6)' } }}
                                    zoomImage={{ src: screenshot, alt: 'Screenshot' }}
                                />
                            )) }
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="flex justify-end">
                            <img src={logo} alt="logo" className="w-14 h-14" />
                        </div>
                        <p className="text-sm"><b>Gratuit pendant {trial} jours</b></p>
                        <p className="text-sm"><b>Puis {price}€ / mois</b></p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4">
                    <ul className="text-sm">
                        <li>
                            <img src={`${withPrefix('/check.svg')}`} alt="check" className="w-2 mr-2 inline" /> Données hébergées en France
                        </li>
                        <li>
                            <img src={`${withPrefix('/check.svg')}`} alt="check" className="w-2 mr-2 inline" /> Domaine personnalisé
                        </li>
                        <li>
                            <img src={`${withPrefix('/check.svg')}`} alt="check" className="w-2 mr-2 inline" /> Sauvegardes journalières
                        </li>
                        <li>
                            <img src={`${withPrefix('/check.svg')}`} alt="check" className="w-2 mr-2 inline" /> Nombre d&apos;utilisateurs illimités
                        </li>
                    </ul>
                    <ul className="text-sm">
                        <li>
                            <img src={`${withPrefix('/check.svg')}`} alt="check" className="w-2 mr-2 inline" /> Support en ligne
                        </li>
                        <li>
                            <img src={`${withPrefix('/check.svg')}`} alt="check" className="w-2 mr-2 inline" /> Mises à jour automatiques
                        </li>
                        <li>
                            <img src={`${withPrefix('/check.svg')}`} alt="check" className="w-2 mr-2 inline" /> Sans tracking
                        </li>
                        <li>
                            <img src={`${withPrefix('/check.svg')}`} alt="check" className="w-2 mr-2 inline" /> Sécurité (SSL, WAF, IPS, Firewall)
                        </li>
                    </ul>
                </div>

                <div className="mt-4">
                    { (!user.firstName || !user.lastName) && (
                        <>
                            <div className="my-2">
                                <label htmlFor="first_name" className="block text-sm font-medium leading-5 text-gray-700">{intl.formatMessage({ id: 'First name' })}</label>
                                <input
                                    id="first_name"
                                    className="mt-1 form-input block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition duration-150 ease-in-out sm:text-sm sm:leading-5"
                                    name="firstName"
                                    value={firstName || ''}
                                    onChange={handleChange}
                                    placeholder="John"
                                />
                            </div>

                            <div className="my-2">
                                <label htmlFor="last_name" className="block text-sm font-medium leading-5 text-gray-700">{intl.formatMessage({ id: 'Last name' })}</label>
                                <input
                                    id="last_name"
                                    className="mt-1 form-input block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition duration-150 ease-in-out sm:text-sm sm:leading-5"
                                    name="lastName"
                                    value={lastName || ''}
                                    onChange={handleChange}
                                    placeholder="Doe"
                                />
                            </div>
                        </>
                    ) }

                    <div className="my-2">
                        <div className="flex justify-between">
                            { stripePaymentMethod === 'card' ? (
                                <label htmlFor="card" className="block text-sm font-medium leading-5 text-gray-700">{intl.formatMessage({ id: 'Card number' })}</label>
                            ) : (
                                <label htmlFor="iban" className="block text-sm font-medium leading-5 text-gray-700">{intl.formatMessage({ id: 'Iban number' })}</label>
                            ) }
                            { /* { !paymentExist && <span className="text-sm leading-5 text-gray-500" title="We do this to prevent fraud and spam, and to ensure service is uninterrupted if you decide to continue using Rewardful after the free trial.">{intl.formatMessage({ id: 'Why do we need a credit card?' })}</span> } */ }
                        </div>
                        { paymentExist ? (
                            <div className="rounded-md bg-gray-50 px-6 py-5 sm:flex sm:items-center sm:justify-between">
                                <div className="sm:flex sm:items-center">
                                    { stripePaymentMethod === 'card' ? (
                                        <svg className="h-8 w-auto sm:flex-shrink-0 sm:h-6" fill="none" viewBox="0 0 36 24" role="img" aria-labelledby="svg-visa">
                                            <title id="svg-visa">VISA
                                            </title>
                                            <rect width="36" height="24" fill="#224DBA" rx="4" />
                                            <path fill="#fff" fillRule="evenodd" d="M10.925 15.673H8.874l-1.538-6c-.073-.276-.228-.52-.456-.635A6.575 6.575 0 005 8.403v-.231h3.304c.456 0 .798.347.855.75l.798 4.328 2.05-5.078h1.994l-3.076 7.5zm4.216 0h-1.937L14.8 8.172h1.937l-1.595 7.5zm4.101-5.422c.057-.404.399-.635.798-.635a3.54 3.54 0 011.88.346l.342-1.615A4.808 4.808 0 0020.496 8c-1.88 0-3.248 1.039-3.248 2.481 0 1.097.969 1.673 1.653 2.02.74.346 1.025.577.968.923 0 .519-.57.75-1.139.75a4.795 4.795 0 01-1.994-.462l-.342 1.616a5.48 5.48 0 002.108.404c2.108.057 3.418-.981 3.418-2.539 0-1.962-2.678-2.077-2.678-2.942zm9.457 5.422L27.16 8.172h-1.652a.858.858 0 00-.798.577l-2.848 6.924h1.994l.398-1.096h2.45l.228 1.096h1.766zm-2.905-5.482l.57 2.827h-1.596l1.026-2.827z" clipRule="evenodd" />
                                        </svg>
                                    ) : (
                                        <svg className="SVGInline-svg SVGInline--cleaned-svg SVG-svg BrandIcon-svg BrandIcon--size--32-svg" height="32" width="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><g fill="none" fillRule="evenodd"><path d="M0 0h32v32H0z" fill="#10298d" /><path d="M27.485 18.42h-2.749l-.37 1.342H22.24L24.533 12h3.104l2.325 7.762h-2.083l-.393-1.342zm-.408-1.512l-.963-3.364-.936 3.364zm-10.452 2.854V12h3.83c.526 0 .928.044 1.203.13.63.202 1.052.612 1.27 1.233.111.325.167.816.167 1.47 0 .788-.06 1.354-.183 1.699-.247.68-.753 1.072-1.517 1.175-.09.015-.472.028-1.146.04l-.341.011H18.68v2.004zm2.056-3.805h1.282c.407-.015.653-.047.744-.096.12-.068.202-.204.242-.408.026-.136.04-.337.04-.604 0-.329-.026-.573-.079-.732-.073-.222-.25-.358-.53-.407a3.91 3.91 0 0 0-.4-.011h-1.299zm-10.469-1.48H6.3c0-.32-.038-.534-.11-.642-.114-.162-.43-.242-.942-.242-.5 0-.831.046-.993.139-.161.093-.242.296-.242.608 0 .283.072.469.215.558a.91.91 0 0 0 .408.112l.386.026c.517.033 1.033.072 1.55.119.654.066 1.126.243 1.421.53.231.222.37.515.414.875.025.216.037.46.037.73 0 .626-.057 1.083-.175 1.374-.213.532-.693.868-1.437 1.009-.312.06-.788.089-1.43.089-1.072 0-1.819-.064-2.24-.196-.517-.158-.858-.482-1.024-.969-.092-.269-.137-.72-.137-1.353h1.914v.162c0 .337.096.554.287.65.13.067.29.101.477.106h.704c.359 0 .587-.019.687-.056a.57.57 0 0 0 .346-.34 1.38 1.38 0 0 0 .044-.374c0-.341-.123-.55-.368-.624-.092-.03-.52-.071-1.28-.123a15.411 15.411 0 0 1-1.274-.128c-.626-.119-1.044-.364-1.252-.736-.184-.315-.275-.793-.275-1.432 0-.487.05-.877.148-1.17.1-.294.258-.517.48-.669.321-.234.735-.371 1.237-.412.463-.04.927-.058 1.391-.056.803 0 1.375.046 1.717.14.833.227 1.248.863 1.248 1.909a5.8 5.8 0 0 1-.018.385z" fill="#fff" /><path d="M13.786 13.092c.849 0 1.605.398 2.103 1.02l.444-.966a3.855 3.855 0 0 0-2.678-1.077c-1.62 0-3.006.995-3.575 2.402h-.865l-.51 1.111h1.111c-.018.23-.017.46.006.69h-.56l-.51 1.111h1.354a3.853 3.853 0 0 0 3.549 2.335c.803 0 1.55-.244 2.167-.662v-1.363a2.683 2.683 0 0 1-2.036.939 2.7 2.7 0 0 1-2.266-1.248h2.832l.511-1.112h-3.761a2.886 2.886 0 0 1-.016-.69h4.093l.51-1.11h-4.25a2.704 2.704 0 0 1 2.347-1.38" fill="#ffcc02" /></g></svg>
                                    ) }
                                    <div className="mt-3 sm:mt-0 sm:ml-4">
                                        <div className="text-sm leading-5 font-medium text-gray-900">
                                            Ending with {stripeLast4}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 sm:mt-0 sm:ml-6 sm:flex-shrink-0">
                                    <span className="inline-flex rounded-md shadow-sm">
                                        <Link to="/settings" onClick={onClose} className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:text-gray-500 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue active:text-gray-800 active:bg-gray-50 transition ease-in-out duration-150">
                                            Edit
                                        </Link>
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <CardElement id="card" className="mt-1 form-input block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition duration-150 ease-in-out sm:text-sm sm:leading-5" />
                        )}

                        { /* <p className="text-xs mt-2">
                            <span role="img" aria-label="lock">🔒</span> Secure payment with Stripe.
                        </p> */ }
                        <p className="text-xs mt-2">{intl.formatMessage({ id: 'Your credit card will not be charged until your trial period ends. We\'ll remind you before your trial ends' })}.</p>
                    </div>
                </div>
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                    <span className="flex w-full rounded-md shadow-sm sm:col-start-2">
                        { isLoading ? (
                            <button onClick={handleSubmit} type="button" className="inline-flex justify-center w-full rounded-md border border-transparent px-4 py-2 bg-gray-600 text-base leading-6 font-medium text-white shadow-sm hover:bg-gray-500 focus:outline-none focus:border-gray-700 focus:shadow-outline-gray transition ease-in-out duration-150 sm:text-sm sm:leading-5">
                                <span className="w-4 h-4 mr-2">
                                    <img src={`${withPrefix('/spinner.svg')}`} alt="spinner" className="spinner" />
                                </span>
                                {intl.formatMessage({ id: 'Loading...' })}
                            </button>
                        ) : (
                            <button onClick={handleSubmit} type="button" id="start_free_trial" className="inline-flex justify-center w-full rounded-md border border-transparent px-4 py-2 bg-gray-600 text-base leading-6 font-medium text-white shadow-sm hover:bg-gray-500 focus:outline-none focus:border-gray-700 focus:shadow-outline-gray transition ease-in-out duration-150 sm:text-sm sm:leading-5">
                                {intl.formatMessage({ id: 'Start my free trial' })}
                            </button>
                        ) }
                    </span>
                    <span className="mt-3 flex w-full rounded-md shadow-sm sm:mt-0 sm:col-start-1">
                        <button onClick={onClose} type="button" className="inline-flex justify-center w-full rounded-md border border-gray-300 px-4 py-2 bg-white text-base leading-6 font-medium text-gray-700 shadow-sm hover:text-gray-500 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue transition ease-in-out duration-150 sm:text-sm sm:leading-5">
                            {intl.formatMessage({ id: 'Cancel' })}
                        </button>
                    </span>
                </div>
            </div>
        </div>
    );
});
