import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Dialog, DialogBackdrop, DialogPanel, TransitionChild } from '@headlessui/react';
import { Bars3Icon, Squares2X2Icon, Cog8ToothIcon, DocumentTextIcon, HomeIcon, XMarkIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

export default ({ children, className = '', stripeEnabled = false }) => {
    const router = useRouter();
    const { t } = useTranslation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const navigation = [
        { name: t('navigation.home'), href: '/', icon: HomeIcon, current: router.pathname === '/' },
        { name: t('navigation.applications'), href: '/apps', icon: Squares2X2Icon, current: router.pathname === '/apps' },
        stripeEnabled ? { name: t('navigation.invoices'), href: '/invoices', icon: DocumentTextIcon, current: router.pathname === '/invoices' } : null,
        { name: t('navigation.settings'), href: '/settings', icon: Cog8ToothIcon, current: router.pathname === '/settings' },
    ].filter(Boolean);

    return (
        <div>
            <Dialog open={sidebarOpen} onClose={setSidebarOpen} className="relative z-50 lg:hidden">
                <DialogBackdrop
                    transition
                    className="fixed inset-0 bg-gray-900/80 transition-opacity duration-300 ease-linear data-closed:opacity-0"
                />

                <div className="fixed inset-0 flex">
                    <DialogPanel
                        transition
                        className="relative mr-16 flex w-full max-w-xs flex-1 transform transition duration-300 ease-in-out data-closed:-translate-x-full"
                    >
                        <TransitionChild>
                            <div className="absolute top-0 left-full flex w-16 justify-center pt-5 duration-300 ease-in-out data-closed:opacity-0">
                                <button type="button" onClick={() => setSidebarOpen(false)} className="-m-2.5 p-2.5">
                                    <span className="sr-only">{t('navigation.closeSidebar')}</span>
                                    <XMarkIcon className="size-6 text-white" />
                                </button>
                            </div>
                        </TransitionChild>

                        <div className="relative flex grow flex-col gap-y-5 overflow-y-auto bg-gray-900 px-6 pb-4 ring-1 ring-white/10">
                            <div className="relative flex h-16 shrink-0 items-center">
                                <img alt="logo" src="/logo.png" className="h-8 w-auto" />
                            </div>
                            <nav className="relative flex flex-1 flex-col">
                                <ul className="flex flex-1 flex-col gap-y-7">
                                    <li>
                                        <ul className="-mx-2 space-y-1">
                                            {navigation.map((item) => (
                                                <li key={item.name}>
                                                    <Link
                                                        href={item.href}
                                                        className={[
                                                            item.current
                                                                ? 'bg-white/5 text-white'
                                                                : 'text-gray-400 hover:bg-white/5 hover:text-white',
                                                            'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold',
                                                        ].join(' ')}
                                                    >
                                                        <item.icon className="size-6 shrink-0" />
                                                        {item.name}
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    </li>
                                    <li className="mt-auto">
                                        <Link
                                            href="/logout"
                                            className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold text-gray-400 hover:bg-white/5 hover:text-white"
                                        >
                                            <ArrowRightOnRectangleIcon className="size-6 shrink-0" />
                                            {t('navigation.signOut')}
                                        </Link>
                                    </li>
                                </ul>
                            </nav>
                        </div>
                    </DialogPanel>
                </div>
            </Dialog>

            <div className="hidden bg-gray-900 ring-1 ring-white/10 lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-black/10 px-6 pb-4">
                    <div className="flex h-16 shrink-0 items-center">
                        <img alt="logo" src="/logo.png" className="h-8 w-auto" />
                    </div>
                    <nav className="flex flex-1 flex-col">
                        <ul className="flex flex-1 flex-col gap-y-7">
                            <li>
                                <ul className="-mx-2 space-y-1">
                                    {navigation.map((item) => (
                                        <li key={item.name}>
                                            <Link
                                                href={item.href}
                                                className={[
                                                    item.current ? 'bg-white/5 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white',
                                                    'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold',
                                                ].join(' ')}
                                            >
                                                <item.icon className="size-6 shrink-0" />
                                                {item.name}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </li>
                            <li className="mt-auto">
                                <Link
                                    href="/logout"
                                    className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold text-gray-400 hover:bg-white/5 hover:text-white"
                                >
                                    <ArrowRightOnRectangleIcon className="size-6 shrink-0" />
                                    {t('navigation.signOut')}
                                </Link>
                            </li>
                        </ul>
                    </nav>
                </div>
            </div>

            <div className="lg:pl-72">
                <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 px-4 sm:gap-x-6 sm:px-6 lg:px-8 lg:hidden bg-white border-gray-200 shadow-sm">
                    <button
                        type="button"
                        onClick={() => setSidebarOpen(true)}
                        className="-m-2.5 p-2.5 text-gray-700 hover:text-gray-900 lg:hidden"
                    >
                        <span className="sr-only">{t('navigation.openSidebar')}</span>
                        <Bars3Icon className="size-6" />
                    </button>
                </div>

                <main className={`px-4 py-4 sm:px-6 lg:py-6 lg:px-8 bg-gray-100 h-full min-h-screen ${className}`}>
                    {children}
                </main>
            </div>
        </div>
    );
};
