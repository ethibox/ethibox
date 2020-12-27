import React, { useRef, useEffect } from 'react';
import { useMutation } from 'graphql-hooks';
import { useIntl } from 'gatsby-plugin-intl';
import { withPrefix } from 'gatsby';
import { withNotifier } from '../context/NotificationContext';

export default withNotifier((props) => {
    const fileInputRef = useRef(null);
    const intl = useIntl();
    const { notify } = props;

    const [uploadTemplates, { loading, error, data }] = useMutation('mutation($file: Upload!) { uploadTemplates(file: $file) }');

    const handleChange = (e) => {
        e.preventDefault();
        uploadTemplates({ variables: { file: fileInputRef.current.files[0] } });
    };

    useEffect(() => {
        if (error) {
            notify({ type: 'error', title: intl.formatMessage({ id: 'Import failed' }) });
        }

        if (data && data.uploadTemplates === true) {
            notify({ type: 'success', title: intl.formatMessage({ id: 'Import success' }) });
        }
    }, [error, data]);

    return (
        <div className="mt-6">
            <label htmlFor="templates" className="block text-sm leading-5 font-medium text-gray-700">Upload Templates</label>
            <div className="mt-2 flex justify-center px-6 py-12 border-2 border-gray-300 border-dashed rounded-md">
                <div className="text-center">
                    { loading ? (
                        <div className="flex flex-col text-center items-center">
                            <img src={`${withPrefix('/spinner-black.svg')}`} className="spinner w-8 mr-4" alt="spinner" />
                            {intl.formatMessage({ id: 'Uploading...' })}
                        </div>
                    ) : (
                        <>
                            <p className="mt-1 text-sm text-gray-600">Drag and drop a json file anywhere or</p>
                            <button type="button" className="mt-2 inline-flex items-center relative justify-center px-2 border border-gray-300 rounded-md ml-2 focus:outline-none hover:text-gray-500">
                                <label className="cursor-pointer">
                                    <span className="mt-2">Upload a file</span>
                                    <input type="file" className="hidden" accept="application/json" ref={fileInputRef} onChange={handleChange} />
                                </label>
                            </button>
                        </>
                    ) }
                </div>
            </div>
        </div>
    );
});
