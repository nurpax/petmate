// @flow
import { combineReducers } from 'redux';
import { routerReducer as router } from 'react-router-redux';
import editor from './editor';

const rootReducer = combineReducers({
  editor,
  router
});

export default rootReducer;
