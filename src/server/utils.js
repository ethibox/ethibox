export const checkStatus = (response) => {
    if (response.status >= 200 && response.status < 300) {
        return response;
    }

    console.error(response);

    throw (new Error(response.statusText));
};

export const findVal = (object, key) => {
    let value;
    Object.keys(object).some((k) => {
        if (k === key) {
            value = object[k];
            return true;
        }
        if (object[k] && typeof object[k] === 'object') {
            value = findVal(object[k], key);
            return value !== undefined;
        }
    });
    return value;
};
