import React, { useState } from 'react';
import { Link, withPrefix } from 'gatsby';
import { Helmet } from 'react-helmet';
import { useIntl } from 'gatsby-plugin-intl';

import { isLoggedIn, clear, getItem, setItem, navigate } from '../utils';

import CloseIcon from '../images/close.svg';
import HomeIcon from '../images/home.svg';
import DocumentIcon from '../images/document.svg';
import SearchIcon from '../images/search.svg';
import SettingsIcon from '../images/settings.svg';
import GridIcon from '../images/grid.svg';
import LogoutIcon from '../images/logout.svg';

export default (props) => {
    const intl = useIntl();
    const [isSidebarOpened, updateSidebar] = useState(false);

    const toggleSidebar = () => {
        updateSidebar(!isSidebarOpened);
    };

    const { children, search } = props;

    const SidebarMenu = [
        { name: 'Home', link: '/', icon: <HomeIcon className="mr-4 h-6 w-6" fill="none" />, position: 1 },
        { name: 'Applications', link: '/apps', icon: <GridIcon className="mr-4 w-6 h-6" fill="none" />, position: 2 },
        { name: 'Invoices', link: '/invoices', icon: <DocumentIcon className="mr-4 w-6 h-6" fill="none" />, position: 3 },
        { name: 'Settings', link: '/settings', icon: <SettingsIcon className="mr-4 w-6 h-6" fill="none" />, position: 4 },
    ];

    if (!isLoggedIn()) {
        if (getItem('token')) {
            clear();
            setItem('expired', true);
        } else {
            clear();
        }
        navigate('/login');
        return false;
    }

    return (
        <>
            <Helmet>
                <script type="text/javascript" src={`${withPrefix('/ethibox.js')}`} />
            </Helmet>
            <div className="h-screen flex overflow-hidden bg-gray-100">
                <div className={`md:hidden ${isSidebarOpened ? 'block' : 'hidden'}`}>
                    <div className={`fixed inset-0 z-30 transition-opacity ease-linear duration-300 opacity-0 ${isSidebarOpened ? 'opacity-100 block' : 'opacity-0 hidden'}`}>
                        <div className="absolute inset-0 bg-gray-600 opacity-75" />
                    </div>
                    <div className="fixed inset-0 flex z-40">
                        <div className={`flex-1 flex flex-col max-w-xs w-full pt-5 pb-4 bg-gray-800 transform ease-in-out duration-300 ${isSidebarOpened ? '' : '-translate-x-full'}`}>
                            <div className="absolute top-0 right-0 -mr-14 p-1">
                                <button
                                    type="button"
                                    onClick={toggleSidebar}
                                    className="flex items-center justify-center h-12 w-12 rounded-full focus:outline-none focus:bg-gray-600"
                                    aria-label="Close sidebar"
                                >
                                    <CloseIcon />
                                </button>
                            </div>
                            <div className="flex-shrink-0 flex items-center px-4">
                                <img className="h-8 w-auto" src={`${withPrefix('/logo-white.svg')}`} alt="logo" />
                                <span className="text-white ml-2 text-xl font-bold">Ethibox</span>
                            </div>
                            <div className="mt-5 flex-1 h-0 overflow-y-auto">
                                <nav className="px-2">
                                    { SidebarMenu.sort((a, b) => (a.position - b.position)).map((m) => (
                                        <Link to={m.link} key={m.name} className="mt-1 group flex items-center px-2 py-2 text-base leading-6 font-medium rounded-md text-gray-300 hover:text-white hover:bg-gray-700 focus:outline-none focus:bg-gray-700 transition ease-in-out duration-150" activeclassname="active text-white bg-gray-900">
                                            {m.icon}
                                            {intl.formatMessage({ id: m.name })}
                                        </Link>
                                    )) }
                                </nav>
                            </div>
                            <div className="flex-shrink-0 overflow-y-auto">
                                <nav className="px-2">
                                    <Link to="/logout" className="mt-1 group flex items-center px-2 py-2 text-base leading-6 font-medium rounded-md text-gray-300 hover:text-white hover:bg-gray-700 focus:outline-none focus:bg-gray-700 transition ease-in-out duration-150" activeclassname="active text-white bg-gray-900">
                                        <LogoutIcon className="mr-4 h-6 w-6" />
                                        {intl.formatMessage({ id: 'Sign out' })}
                                    </Link>
                                </nav>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="hidden md:flex md:flex-shrink-0">
                    <div className="flex flex-col w-64">
                        <div className="flex items-center h-16 flex-shrink-0 px-4 bg-gray-900">
                            <img className="h-8 w-auto" src={`${withPrefix('/logo-white.svg')}`} alt="logo" />
                            <span className="text-white ml-2 text-2xl font-bold">Ethibox</span>
                        </div>
                        <div className="h-0 flex-1 flex flex-col overflow-y-auto">
                            <nav className="flex-1 px-2 py-4 bg-gray-800">
                                { SidebarMenu.map((m) => (
                                    <Link to={m.link} key={m.name} className="mt-1 group flex items-center px-2 py-2 text-base leading-6 font-medium rounded-md text-gray-300 hover:text-white hover:bg-gray-700 focus:outline-none focus:bg-gray-700 transition ease-in-out duration-150" activeclassname="active text-white bg-gray-900">
                                        {m.icon}
                                        <span className="truncate">{intl.formatMessage({ id: m.name })}</span>
                                        { m.label ? (
                                            <span className="ml-auto inline-block py-0.5 px-2 text-xs leading-4 rounded-full text-gray-600 bg-gray-200 group-hover:bg-gray-200 group-focus:bg-gray-300 transition ease-in-out duration-150">{m.label}</span>
                                        ) : '' }
                                    </Link>
                                )) }
                            </nav>
                        </div>
                        <div className="flex-shrink-0 bg-gray-800">
                            <nav className="p-2">
                                <Link to="/logout" className="mt-1 group flex items-center px-2 py-2 text-base leading-6 font-medium rounded-md text-gray-300 hover:text-white hover:bg-gray-700 focus:outline-none focus:bg-gray-700 transition ease-in-out duration-150" activeclassname="active text-white bg-gray-900">
                                    <LogoutIcon className="mr-4 h-6 w-6" />
                                    {intl.formatMessage({ id: 'Sign out' })}
                                </Link>
                            </nav>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col w-0 flex-1 overflow-hidden">
                    <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
                        <button
                            type="button"
                            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:bg-gray-100 focus:text-gray-600 md:hidden"
                            onClick={toggleSidebar}
                            aria-label="Open sidebar"
                        >
                            <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M4 6h16M4 12h16M4 18h7"
                                />
                            </svg>
                        </button>
                        <div className="flex-1 px-4 flex justify-between">
                            <div className="flex-1 flex">
                                { search && (
                                    <div className="w-full flex md:ml-0">
                                        <label htmlFor="search_field" className="sr-only">Search</label>
                                        <div className="relative w-full text-gray-400 focus-within:text-gray-600">
                                            <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                                                <SearchIcon />
                                            </div>
                                            <input id="search_field" className="block w-full h-full pl-8 pr-3 py-2 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 sm:text-sm" placeholder={intl.formatMessage({ id: 'Search application...' })} type="search" />
                                        </div>
                                    </div>
                                ) }
                            </div>
                        </div>
                    </div>
                    <main className="flex-1 relative overflow-y-auto py-6 focus:outline-none">
                        {children}
                    </main>
                </div>
            </div>
        </>
    );
};
