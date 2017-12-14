import { combineReducers } from 'redux';
import ApplicationReducer from '../application/ApplicationReducer';
import ChartReducer from '../chart/ChartReducer';

const reducers = combineReducers({ ApplicationReducer, ChartReducer });

export default reducers;
