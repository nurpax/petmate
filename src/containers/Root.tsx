// @flow
import React, { Component } from 'react';
import { Store } from 'redux'
import { Provider } from 'react-redux';

import App from './App';
import { RootState } from '../redux/types'

interface RootProps {
  store: Store<RootState>;
};

export default class Root extends Component<RootProps> {
  render() {
    return (
      <Provider store={this.props.store}>
        <App />
      </Provider>
    );
  }
}
