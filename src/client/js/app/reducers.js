import { combineReducers } from 'redux';
import AppReducer from '../application/ApplicationReducer';
import SidebarReducer from '../sidebar/SidebarReducer';

const reducers = combineReducers({ AppReducer, SidebarReducer });

export default reducers;
