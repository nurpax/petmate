// @flow
import { combineReducers } from 'redux';
import { routerReducer as router } from 'react-router-redux';
import editor from './editor';
import { Framebuffer } from '../redux/editor';

const rootReducer = combineReducers({
  editor,
  framebuf: Framebuffer.reducer,
  router
});

export default rootReducer;
