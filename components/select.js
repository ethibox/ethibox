import { ChevronDownIcon } from '@heroicons/react/16/solid';

export default ({ id, name, value, onChange, children, label, className = '', ...rest }) => (
    <div className={className}>
        <label htmlFor={id} className="block text-sm/6 font-medium text-gray-900">
            {label}
        </label>
        <div className="mt-2 grid grid-cols-1">
            <select
                id={id}
                name={name}
                value={value}
                onChange={onChange}
                className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-1.5 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-gray-600 sm:text-sm/6"
                {...rest}
            >
                {children}
            </select>
            <ChevronDownIcon
                aria-hidden="true"
                className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4"
            />
        </div>
    </div>
);
