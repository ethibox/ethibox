import React from 'react';
import { useRecoilValue } from 'recoil';
import { Link, useIntl } from 'gatsby-plugin-intl';
import TemplateIcon from '../images/template.svg';

import Template from './template';
import { templatesState } from '../atoms';

export default () => {
    const intl = useIntl();
    const templates = useRecoilValue(templatesState);

    if (templates.length === 0) {
        return (
            <div className="min-h-full flex items-center justify-center">
                <div className="flex flex-col justify-center">
                    <TemplateIcon className="w-24 m-auto text-gray-600" />
                    <h4 className="text-center text-2xl">{intl.formatMessage({ id: 'You have no templates' })}</h4>
                    <span className="rounded-md shadow-sm m-auto mt-3">
                        <Link
                            to="/admin"
                            className="inline-flex justify-center py-2 px-4 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-gray-600 hover:bg-gray-500 focus:outline-none focus:border-gray-700 focus:shadow-outline-gray active:bg-gray-700 transition duration-150 ease-in-out"
                        >
                            {intl.formatMessage({ id: 'Add templates' })}
                        </Link>
                    </span>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                <h1 className="text-2xl font-semibold text-gray-900">{intl.formatMessage({ id: 'Application Store' })}</h1>
                <p className="mt-1 text-sm text-gray-500">{intl.formatMessage({ id: 'A selection of the best open-source applications' })}.</p>
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 my-10">
                <div className="grid gap-3 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3 lg:gap-3 xl:grid-cols-4 xl:gap-4">
                    { templates.map((template) => (
                        <Template template={template} key={template.name} />
                    )) }
                </div>
            </div>
        </>
    );
};
