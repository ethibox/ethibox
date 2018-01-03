import { combineReducers } from 'redux';
import ApplicationReducer from '../application/ApplicationReducer';
import ModalReducer from '../modal/ModalReducer';
import LoaderReducer from '../loader/LoaderReducer';

const reducers = combineReducers({ ApplicationReducer, ModalReducer, LoaderReducer });

export default reducers;
