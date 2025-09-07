export default ({ title, subtitle, icon, button, className = '', ...rest }) => (
    <div className={`text-center ${className}`} {...rest}>
        {icon}
        <h3 className="mt-2 text-md font-medium text-gray-900">{title}</h3>
        <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
        {button && (
            <div className="mt-4">
                {button}
            </div>
        )}
    </div>
);
