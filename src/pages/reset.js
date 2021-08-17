import React, { useState } from 'react';
import { useIntl, Link } from 'gatsby-plugin-intl';
import isEmail from 'validator/lib/isEmail';
import { withPrefix } from 'gatsby';
import { useLocation } from '@reach/router';

import { checkStatus, navigate, isLoggedIn } from '../utils';

export default () => {
    const intl = useIntl();
    const location = useLocation();
    const [state, setState] = useState({ email: '', errors: [], success: false, isLoading: false });

    const handleChange = (e) => setState({ ...state, [e.target.name]: e.target.value, errors: [], success: false });

    const handleSubmit = async (e) => {
        const errors = [];
        const { email } = state;

        if (!isEmail(email)) {
            errors.push('Please enter your e-mail');
        }

        setState({ ...state, errors });

        if (!errors.length) {
            e.preventDefault();

            setState({ ...state, isLoading: true });

            const baseUrl = `${location.protocol}//${location.host}${withPrefix('/')}`;

            await fetch(withPrefix('/graphql'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: `mutation {
                    reset(baseUrl: "${baseUrl}", email: "${email}")
                }` }),
            })
                .then(checkStatus)
                .then(() => {
                    setTimeout(() => {
                        setState({ ...state, isLoading: false, success: true });
                    }, 1000);
                })
                .catch(({ message }) => {
                    setTimeout(() => {
                        setState({ ...state, errors: [message], isLoading: false });
                    }, 1000);
                });
        }
    };

    const { email, errors, success, isLoading } = state;

    if (isLoggedIn()) {
        navigate('/');
        return true;
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full">
                <div className="my-2">
                    <img className="mx-auto h-14 w-auto" src={`${withPrefix('/logo-black.svg')}`} alt="logo" />
                    <h2 className="mt-6 text-center text-3xl leading-9 font-extrabold text-gray-900">
                        {intl.formatMessage({ id: 'Forgot your password?' })}
                    </h2>
                    <p className="mt-2 text-center text-sm leading-5 text-gray-600">
                        {intl.formatMessage({ id: 'Or' })}{' '}
                        <Link
                            to="/login"
                            className="font-medium text-gray-600 hover:text-gray-500 focus:outline-none focus:underline transition ease-in-out duration-150"
                        >
                            {intl.formatMessage({ id: 'Sign in' })}
                        </Link>
                    </p>
                </div>
                { success && (
                    <div className="rounded-md bg-green-100 p-4 mb-2">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3 success">
                                <h3 className="text-sm leading-5 font-medium text-green-800">{intl.formatMessage({ id: 'Check your inbox' })}</h3>
                                <div className="mt-2 text-sm leading-5 text-green-700">
                                    <p>
                                        {intl.formatMessage({ id: 'If your email address is associated with an Ethibox account. You\'ll receive an email shortly.' })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) }
                { errors.length > 0 && (
                    <div className="rounded-md bg-red-50 p-4 my-2">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm leading-5 font-medium text-red-800">
                                    {intl.formatMessage({ id: 'There were {errors} error(s)' }, { errors: errors.length })}
                                </h3>
                                <div className="mt-2 text-sm leading-5 text-red-700">
                                    <ul className="list-disc pl-5">
                                        { errors.map((error) => (
                                            <li className="error" key={error}>{error}</li>
                                        )) }
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                ) }
                <form action="#" method="POST">
                    <div className="rounded-md shadow-sm">
                        <div>
                            <input
                                name="email"
                                type="email"
                                value={email}
                                onChange={handleChange}
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:z-10 sm:text-sm sm:leading-5"
                                placeholder={intl.formatMessage({ id: 'Email address' })}
                            />
                        </div>
                    </div>

                    <div className="mt-2">
                        { isLoading ? (
                            <button
                                className="inline-flex items-center group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-gray-600 hover:bg-gray-500 focus:outline-none focus:border-gray-700 focus:shadow-outline-gray active:bg-gray-700 transition duration-150 ease-in-out"
                                type="submit"
                            >
                                <span className="w-4 h-4 mr-2">
                                    <img src={`${withPrefix('/spinner.svg')}`} alt="spinner" className="spinner" />
                                </span>
                                {intl.formatMessage({ id: 'Sending in progress...' })}
                            </button>
                        ) : (
                            <button
                                type="submit"
                                onClick={handleSubmit}
                                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-gray-600 hover:bg-gray-500 focus:outline-none focus:border-gray-700 focus:shadow-outline-gray active:bg-gray-700 transition duration-150 ease-in-out"
                            >
                                {intl.formatMessage({ id: 'Send password reset link' })}
                            </button>
                        ) }
                    </div>
                </form>
            </div>
        </div>
    );
};
