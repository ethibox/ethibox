import { combineReducers } from 'redux';
import ApplicationReducer from '../application/ApplicationReducer';
import ModalReducer from '../modal/ModalReducer';
import LoaderReducer from '../loader/LoaderReducer';
import LoginReducer from '../login/LoginReducer';
import RegisterReducer from '../register/RegisterReducer';
import PackageReducer from '../package/PackageReducer';
import SettingsReducer from '../settings/SettingsReducer';
import SubscribeReducer from '../subscribe/SubscribeReducer';
import SynchronizeReducer from '../synchronize/SynchronizeReducer';

const reducers = combineReducers({
    ApplicationReducer,
    ModalReducer,
    LoaderReducer,
    LoginReducer,
    RegisterReducer,
    PackageReducer,
    SettingsReducer,
    SubscribeReducer,
    SynchronizeReducer,
});

export default reducers;
