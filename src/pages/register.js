import React from 'react';
import { withPrefix } from 'gatsby';
import { useIntl, Link } from 'gatsby-plugin-intl';
import { useImmer } from 'use-immer';
import isEmail from 'validator/lib/isEmail';

import { checkStatus, setToken, isLoggedIn, navigate, redirect } from '../utils';

const Register = () => {
    const intl = useIntl();
    const [state, updateState] = useImmer({ email: '', password: '', errors: [] });
    const [isLoading, updateLoading] = useImmer(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        updateState((draft) => { draft[name] = value; });
    };

    const handleSubmit = async (e) => {
        const errors = [];
        const { email, password } = state;

        if (!isEmail(email)) {
            errors.push('Please enter your e-mail');
        }

        if (!password || password.length < 6) {
            errors.push('Your password must be at least 6 characters');
        }

        updateState((draft) => { draft.errors = errors; });

        if (!errors.length) {
            e.preventDefault();

            updateLoading(() => true);

            await fetch(withPrefix('/graphql'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: `mutation {
                    register(email: "${email}", password: "${password}") { token }
                }` }),
            })
                .then(checkStatus)
                .then(({ data }) => {
                    setToken(data.register.token);
                    setTimeout(() => {
                        redirect('/');
                    }, 1000);
                })
                .catch(({ message }) => {
                    setTimeout(() => {
                        updateState((draft) => { draft.errors = [message]; });
                        updateLoading(() => false);
                    }, 1000);
                });
        }
    };

    const { email, password, errors } = state;

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
                        {intl.formatMessage({ id: 'Sign up on Ethibox' })}
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
                                            <li className="error" key={error}>{intl.formatMessage({ id: error })}</li>
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
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:z-10 focus:border-gray-300 focus:ring-0 sm:text-sm sm:leading-5"
                                placeholder={intl.formatMessage({ id: 'Email address' })}
                            />
                        </div>
                        <div className="-mt-px">
                            <input
                                name="password"
                                type="password"
                                value={password}
                                onChange={handleChange}
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:z-10 focus:border-gray-300 focus:ring-0 sm:text-sm sm:leading-5"
                                placeholder={intl.formatMessage({ id: 'Password' })}
                            />
                        </div>
                    </div>

                    <div className="mt-6">
                        { isLoading ? (
                            <button
                                className="inline-flex items-center group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-gray-600 hover:bg-gray-500 focus:outline-none focus:border-gray-700 focus:shadow-outline-gray active:bg-gray-700 transition duration-150 ease-in-out"
                                type="submit"
                            >
                                <span className="w-4 h-4 mr-2">
                                    <img src={`${withPrefix('/spinner.svg')}`} alt="spinner" className="spinner" />
                                </span>
                                {intl.formatMessage({ id: 'Sign up in progress...' })}
                            </button>
                        ) : (
                            <button
                                type="submit"
                                onClick={handleSubmit}
                                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-gray-600 hover:bg-gray-500 focus:outline-none focus:border-gray-700 focus:shadow-outline-gray active:bg-gray-700 transition duration-150 ease-in-out"
                            >
                                {intl.formatMessage({ id: 'Sign up' })}
                            </button>
                        ) }
                    </div>

                    <p className="mt-2 text-sm leading-5 text-gray-600 text-center">
                        {intl.formatMessage({ id: 'By creating an account, you agree to the' })} <a href="/cgu" target="_blank" className="underline">{intl.formatMessage({ id: 'Terms of Service' })}</a>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Register;
