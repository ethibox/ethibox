import { Dialog, DialogBackdrop, DialogPanel, DialogTitle, DialogDescription, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { ExclamationTriangleIcon, TrashIcon } from '@heroicons/react/24/outline';
import { EllipsisVerticalIcon } from '@heroicons/react/20/solid';

const Modal = ({ open, onClose, children }) => (
    <Dialog open={open} onClose={onClose} className="relative z-50">
        <DialogBackdrop className="fixed inset-0 bg-gray-500/75 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in" transition />

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
            <div className="flex min-h-full justify-center p-4 text-center items-center sm:p-0">
                <DialogPanel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 sm:w-full sm:max-w-lg data-closed:sm:translate-y-0 data-closed:sm:scale-95" transition>
                    {children}
                </DialogPanel>
            </div>
        </div>
    </Dialog>
);

Modal.Dropdown = ({ items = [] }) => (
    <div className="float-right" data-test="modal-dropdown">
        <Menu as="div" className="relative inline-block text-left">
            <MenuButton className="relative flex items-center rounded-full text-gray-400 outline-offset-6 hover:text-gray-600 cursor-pointer">
                <span className="absolute -inset-2" />
                <span className="sr-only">Open options</span>
                <EllipsisVerticalIcon className="size-6" />
            </MenuButton>

            <MenuItems
                transition
                className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg outline-1 outline-black/5 transition data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
            >
                <div className="py-1">
                    {items.map(({ onClick, text, icon }) => (
                        <MenuItem key={text}>
                            <button type="button" onClick={onClick} className="flex w-full cursor-pointer px-4 py-2 text-sm text-gray-700 data-focus:bg-gray-100 data-focus:text-gray-900 data-focus:outline-hidden" data-test="modal-dropdown-item">
                                {icon}
                                <span>{text}</span>
                            </button>
                        </MenuItem>
                    ))}
                </div>
            </MenuItems>
        </Menu>
    </div>
);

Modal.Header = ({ children, icon, className = '' }) => (
    <div className={`bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 ${className}`}>
        <div className={`${icon ? 'flex items-start' : ''}`}>
            {icon && (
                <div className="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:size-10 !mr-4">
                    {icon}
                </div>
            )}
            <div className="mt-3 sm:mt-0">
                {children}
            </div>
        </div>
    </div>
);

Modal.Footer = ({ children, className = '' }) => (
    <div className={`bg-gray-50 px-4 py-3 flex flex-row-reverse px-6 gap-2 ${className}`}>
        {children}
    </div>
);

Modal.Icon = ({ icon, className = '' }) => (
    <div className={`mx-auto flex size-12 shrink-0 items-center justify-center rounded-full sm:mx-0 sm:size-10 ${className}`}>
        {icon}
    </div>
);

Modal.Title = ({ className = '', ...props }) => (
    <DialogTitle className={`text-lg font-semibold text-gray-900 ${className}`} {...props} />
);

Modal.Description = ({ className = '', ...props }) => (
    <DialogDescription className={`mt-2 text-sm text-gray-500 ${className}`} {...props} />
);

Modal.ExclamationTriangleIcon = <ExclamationTriangleIcon className="size-6 text-red-600" />;

Modal.TrashIcon = <TrashIcon className="mr-3 size-5 text-gray-400" />;

export default Modal;
