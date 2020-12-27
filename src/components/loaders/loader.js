import React from 'react';
import { withPrefix } from 'gatsby';

export default () => {
    return (
        <div className="fixed bottom-0 inset-0 flex items-center justify-center z-50">
            <div className="fixed inset-0 transition-opacity">
                <div className="absolute inset-0 bg-black opacity-75" />
            </div>
            <div className="transform">
                <p className="inline-flex text-white text-3xl">
                    <img src={`${withPrefix('/spinner.svg')}`} className="spinner w-8 mr-4" alt="spinner" />
                    <span>Loading...</span>
                </p>
            </div>
        </div>
    );
};
