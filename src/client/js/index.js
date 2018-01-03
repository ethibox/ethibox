import React from 'react';
import ReactDOM from 'react-dom';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import reducers from './app/reducers';
import App from './app/App';

let store;
if (process.env.NODE_ENV === 'production') {
    store = createStore(reducers, applyMiddleware(thunk));
} else {
    store = createStore(reducers, composeWithDevTools(applyMiddleware(thunk)));
}

document.addEventListener('keypress', ({ key }) => {
    const modal = store.getState().ModalReducer;

    if (modal.isOpen && (key === 'Enter' || key === 'Escape')) {
        store.dispatch({ type: 'CLOSE_MODAL' });
    }
});

ReactDOM.render(
    <Provider store={store}>
        <App />
    </Provider>,
    document.getElementById('root'),
);
