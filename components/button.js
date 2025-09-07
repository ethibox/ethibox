import Loading from './loading';

export default ({ secondary, children, onClick, disabled, loading, loadingText, className = '', ...rest }) => {
    const baseClassName = `inline-flex rounded-md items-center justify-center px-5 py-2 border cursor-pointer focus:outline-none disabled:cursor-not-allowed disabled:opacity-75 ${className}`;

    const primaryClassName = `${baseClassName} border-transparent text-white !bg-gray-600 hover:!bg-gray-700 disabled:hover:!bg-gray-600`;

    const secondaryClassName = `${baseClassName} border-gray-300 text-gray-700 hover:text-gray-900 disabled:hover:text-gray-700 disabled:hover:border-gray-300 hover:border-gray-400`;

    const buttonClassName = secondary ? secondaryClassName : primaryClassName;

    return (
        <button type="button" onClick={onClick} className={buttonClassName} disabled={disabled || loading} {...rest}>
            {loading ? <Loading text={loadingText} className={secondary ? '' : 'text-white'} /> : children}
        </button>
    );
};
