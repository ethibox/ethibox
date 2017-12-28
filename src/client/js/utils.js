export const checkStatus = (response) => {
    if (response.status >= 200 && response.status < 300) {
        return response;
    }

    console.error(response);

    throw (new Error(response));
};
