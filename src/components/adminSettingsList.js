import React from 'react';

import { useRecoilValue, useSetRecoilState } from 'recoil';
import { autocast, decamelize } from '../utils';
import { adminSettingsState } from '../atoms';

export default () => {
    const { settings } = useRecoilValue(adminSettingsState);
    const updateAdminSettings = useSetRecoilState(adminSettingsState);

    const handleChange = async (e, index) => {
        const { name, value } = e.target;
        updateAdminSettings((adminSettings) => {
            const newAdminSettings = {
                ...adminSettings,
                ...{ settings: [...settings.map((s, i) => (i === index ? { name, value } : s))] },
            };

            return newAdminSettings;
        });
    };

    return (
        <>
            { settings.map(({ name, value }, index) => {
                const label = name.replace(/([A-Z])/, '');

                if (typeof autocast(value) === 'boolean') {
                    return (
                        <div key={name} className="col-span-2 sm:col-span-1">
                            <label htmlFor={name} className="block text-sm font-medium leading-5 text-gray-700 capitalize">{decamelize(name)}</label>
                            <select
                                id={decamelize(name, '_')}
                                name={name}
                                value={value}
                                onChange={(e) => handleChange(e, index)}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 sm:text-sm rounded-md appearance-none"
                            >
                                <option value="false">No</option>
                                <option value="true">Yes</option>
                            </select>
                        </div>
                    );
                }

                return (
                    <div key={name} className="col-span-2 sm:col-span-1">
                        <label htmlFor={decamelize(name, '_')} className="block text-sm font-medium leading-5 text-gray-700 capitalize">{decamelize(name)}</label>
                        <input
                            id={decamelize(name, '_')}
                            className="mt-1 form-input block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition duration-150 ease-in-out sm:text-sm sm:leading-5"
                            name={name}
                            value={value}
                            type={typeof autocast(value) === 'number' ? 'number' : 'text'}
                            placeholder=""
                            onChange={(e) => handleChange(e, index)}
                        />
                    </div>
                );
            }) }
        </>
    );
};
