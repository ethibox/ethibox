import React, { useState, useEffect, useRef } from 'react';
import { useRecoilValue } from 'recoil';
import { useIntl } from 'gatsby-plugin-intl';
import { Link } from 'gatsby';

import { userState } from '../atoms';
import { gravatar } from '../utils';

export default () => {
    const intl = useIntl();
    const ref = useRef();

    const { isAdmin, email } = useRecoilValue(userState);

    const [isMenuDisplayed, updateMenuDisplayed] = useState(false);

    const handleClickOutside = (e) => {
        if (!ref.current.contains(e.target)) {
            updateMenuDisplayed(false);
        }
    };

    useEffect(() => {
        document.addEventListener('click', handleClickOutside, true);
        return () => document.removeEventListener('click', handleClickOutside, true);
    }, []);

    return (
        <div ref={ref} className="ml-3 relative">
            <div>
                <button
                    type="button"
                    className="max-w-xs flex items-center text-sm rounded-full focus:outline-none focus:shadow-outline"
                    onClick={() => updateMenuDisplayed(!isMenuDisplayed)}
                    id="user-menu"
                    aria-label="User menu"
                >
                    <img className="h-8 w-8 rounded-full border" src={`${gravatar(email)}`} alt="avatar" />
                </button>
            </div>
            <div className={`origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg ${isMenuDisplayed ? 'block' : 'hidden'}`}>
                <div
                    className="py-1 rounded-md bg-white shadow-xs"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="user-menu"
                >
                    <div className="px-4 py-3">
                        <p className="text-sm leading-5">{intl.formatMessage({ id: 'Signed in as' })}</p>
                        <p className="text-sm leading-5 font-medium text-gray-900 truncate">{email}</p>
                    </div>
                    <div className="border-t border-gray-100" />
                    <Link
                        to="/settings"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition ease-in-out duration-150"
                        role="menuitem"
                    >
                        {intl.formatMessage({ id: 'Settings' })}
                    </Link>
                    { isAdmin && (
                        <Link
                            to="/admin"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition ease-in-out duration-150"
                            role="menuitem"
                        >
                            {intl.formatMessage({ id: 'Admin' })}
                        </Link>
                    ) }
                    <Link
                        to="/logout"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition ease-in-out duration-150"
                        role="menuitem"
                    >
                        {intl.formatMessage({ id: 'Sign out' })}
                    </Link>
                </div>
            </div>
        </div>
    );
};
