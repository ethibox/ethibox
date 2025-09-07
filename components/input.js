import { useState } from 'react';
import { ExclamationCircleIcon } from '@heroicons/react/16/solid';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

// eslint-disable-next-line complexity
export default ({
    id,
    name,
    label,
    labelRight,
    required,
    placeholder,
    autoComplete,
    error,
    onBlur,
    onInput,
    onChange,
    defaultValue,
    value,
    prefix,
    disabled = false,
    type = 'text',
    className = '',
    ...rest
}) => {
    const [inputValue, setInputValue] = useState(defaultValue || '');
    const [showPassword, setShowPassword] = useState(false);
    const currentValue = value !== undefined ? value : inputValue;
    const isPassword = type === 'password';

    const getInputClassName = (hasError) => (hasError
        ? 'col-start-1 row-start-1 block w-full rounded-md bg-white py-1.5 pr-10 pl-3 text-red-900 outline-1 -outline-offset-1 outline-red-300 placeholder:text-red-300 sm:pr-9 sm:text-sm/6'
        : `block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 disabled:outline-gray-200 sm:text-sm/6 ${prefix ? '-ml-px rounded-none !rounded-r-md' : ''} ${isPassword ? 'pr-10' : ''}`);

    return (
        <div className={className}>
            <label htmlFor={id} className="block text-sm/6 font-medium text-gray-900">
                {labelRight ? (
                    <div className="flex items-center justify-between">
                        <span>{label}</span>
                        <span>{labelRight}</span>
                    </div>
                ) : label}
            </label>
            <div className="relative mt-2 flex">
                {prefix && (
                    <div className="flex shrink-0 items-center rounded-l-md bg-white px-3 text-base text-gray-500 outline-1 -outline-offset-1 outline-gray-300 sm:text-sm/6 !bg-gray-50">
                        {prefix}
                    </div>
                )}
                <input
                    id={id}
                    name={name}
                    type={isPassword && showPassword ? 'text' : type}
                    required={required}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    onBlur={onBlur}
                    onInput={onInput}
                    defaultValue={defaultValue}
                    value={value}
                    disabled={disabled}
                    className={getInputClassName(Boolean(error))}
                    onChange={(e) => {
                        setInputValue(e.target.value);
                        if (onChange) {
                            onChange(e);
                        }
                    }}
                    {...rest}
                />
                {isPassword && currentValue && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-500 cursor-pointer">
                            {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                        </button>
                    </div>
                )}
                {error && (
                    <ExclamationCircleIcon
                        className="pointer-events-none col-start-1 row-start-1 mr-3 size-5 self-center justify-self-end text-red-500 sm:size-4"
                    />
                )}
            </div>
            {error && (<p id={`${id}-error`} className="mt-2 text-sm text-red-600">{error}</p>)}
        </div>
    );
};
