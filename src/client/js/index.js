import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import { loadState, saveState } from './localStorage';
import reducers from './app/reducers';
import App from './app/App';

const store = createStore(reducers, loadState());
store.subscribe(() => {
    saveState({ AppReducer: store.getState().AppReducer });
    console.log('store changed!', store.getState());
});

ReactDOM.render(
    <Provider store={store}>
        <App />
    </Provider>,
    document.getElementById('root'),
);
