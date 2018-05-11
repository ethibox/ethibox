import { combineReducers } from 'redux';
import ApplicationReducer from '../application/ApplicationReducer';
import ModalReducer from '../modal/ModalReducer';
import LoaderReducer from '../loader/LoaderReducer';
import UserReducer from '../user/UserReducer';
import PackageReducer from '../package/PackageReducer';

const reducers = combineReducers({ ApplicationReducer, ModalReducer, LoaderReducer, UserReducer, PackageReducer });

export default reducers;
