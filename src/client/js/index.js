import 'babel-polyfill';
import React from 'react';
import ReactDOM from 'react-dom';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import io from 'socket.io-client';
import reducers from './app/reducers';
import App from './app/App';
import Register from './user/Register';
import Login from './user/Login';
import { isConnect } from './utils';

let store;
if (process.env.NODE_ENV === 'production') {
    store = createStore(reducers, applyMiddleware(thunk));
} else {
    store = createStore(reducers, composeWithDevTools(applyMiddleware(thunk)));
}

document.addEventListener('keypress', ({ key }) => {
    const modal = store.getState().ModalReducer;

    if (modal.isOpen && (key === 'Escape')) {
        store.dispatch({ type: 'CLOSE_MODAL' });
    }
});

const endpoint = (process.env.NODE_ENV === 'production') ? `//${window.location.host}` : `//${window.location.hostname}:${process.env.NODE_PORT}`;

if (isConnect()) {
    global.socket = io(endpoint, { query: `token=${localStorage.getItem('token')}` });
} else {
    global.socket = io(endpoint);
}

ReactDOM.render(
    <Provider store={store}>
        <Router>
            <div style={{ height: '100%' }}>
                <Route exact path="/" render={() => (isConnect() ? (<App />) : (<Login />))} />
                <Route path="/register" component={Register} />
                <Route path="/login" component={Login} />
            </div>
        </Router>
    </Provider>,
    document.getElementById('root'),
);
