import {createStore, combineReducers} from 'redux';
import userReducer from './userReducer';

const rootReducer = combineReducers({
  getUserDetails: userReducer,
});

const store = createStore(rootReducer);

export default store;
