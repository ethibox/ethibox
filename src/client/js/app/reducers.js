import { combineReducers } from 'redux';
import ApplicationReducer from '../application/ApplicationReducer';
import ChartReducer from '../chart/ChartReducer';
import SidebarReducer from '../sidebar/SidebarReducer';

const reducers = combineReducers({ ApplicationReducer, ChartReducer, SidebarReducer });

export default reducers;
