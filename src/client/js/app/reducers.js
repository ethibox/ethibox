import { combineReducers } from 'redux';
import ApplicationReducer from '../application/ApplicationReducer';
import ChartReducer from '../chart/ChartReducer';
import ModalReducer from '../modal/ModalReducer';
import LoaderReducer from '../loader/LoaderReducer';

const reducers = combineReducers({ ApplicationReducer, ChartReducer, ModalReducer, LoaderReducer });

export default reducers;
