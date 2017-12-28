import { combineReducers } from 'redux';
import ApplicationReducer from '../application/ApplicationReducer';
import ChartReducer from '../chart/ChartReducer';
import ModalReducer from '../modal/ModalReducer';

const reducers = combineReducers({ ApplicationReducer, ChartReducer, ModalReducer });

export default reducers;
