import { Transition, Portal } from '@headlessui/react';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { XMarkIcon } from '@heroicons/react/20/solid';

const Notification = ({ title, description, icon, show, onClose, button }) => {
    if (!show) return null;

    return (
        <Portal>
            <div className="pointer-events-none fixed inset-0 flex px-4 py-6 items-start p-6 z-50" data-test="notification">
                <div className="flex w-full flex-col items-center space-y-4 sm:items-end">
                    <Transition show={show}>
                        <div className="pointer-events-auto w-full max-w-sm rounded-lg bg-white shadow-lg outline-1 outline-black/5 transition data-closed:opacity-0 data-enter:transform data-enter:duration-300 data-enter:ease-out data-closed:data-enter:translate-y-2 data-leave:duration-100 data-leave:ease-in data-closed:data-enter:sm:translate-x-2 data-closed:data-enter:sm:translate-y-0">
                            <div className="p-4">
                                <div className="flex items-start">
                                    <div className="shrink-0">
                                        {icon}
                                    </div>
                                    <div className="ml-3 w-0 flex-1 pt-0.5">
                                        <p className="text-sm font-medium text-gray-900">{title}</p>
                                        <p className="mt-1 text-sm text-gray-500">{description}</p>
                                        {button && (
                                            <div className="mt-4 flex">
                                                <button
                                                    type="button"
                                                    onClick={button.onClick}
                                                    className="inline-flex items-center rounded-md bg-gray-600 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-500 focus:outline-2 focus:outline-offset-2 focus:outline-gray-600"
                                                >
                                                    {button.text}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="ml-4 flex shrink-0">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="inline-flex rounded-md text-gray-400 hover:text-gray-500 focus:outline-2 focus:outline-offset-2 focus:outline-gray-600 cursor-pointer"
                                        >
                                            <span className="sr-only">Close</span>
                                            <XMarkIcon className="size-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Transition>
                </div>
            </div>
        </Portal>
    );
};

Notification.CheckCircleIcon = <CheckCircleIcon className="size-6 text-green-400" />;

Notification.XCircleIcon = <XCircleIcon className="size-6 text-red-400" />;

export default Notification;
