import { combineReducers } from 'redux';
import ApplicationReducer from '../application/ApplicationReducer';
import ModalReducer from '../modal/ModalReducer';
import LoaderReducer from '../loader/LoaderReducer';
import UserReducer from '../user/UserReducer';

const reducers = combineReducers({ ApplicationReducer, ModalReducer, LoaderReducer, UserReducer });

export default reducers;
