export default (state = { settings: { } }, action) => {
    localStorage.setItem('lastActionDate', Date.now());

    switch (action.type) {
        case 'LOAD_SETTINGS_SUCCESS': {
            if (!Stripe.key) {
                Stripe.setPublishableKey(action.settings.stripePublishableKey);
            }
            return { ...state, settings: action.settings };
        }

        default: {
            return state;
        }
    }
};
