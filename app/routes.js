/* eslint flowtype-errors/show-errors: 0 */
import React from 'react';
import { Switch, Route } from 'react-router';
import App from './containers/App';
import EditorPage from './containers/EditorPage';

export default () => (
  <App>
    <Switch>
      <Route path="/" component={EditorPage} />
    </Switch>
  </App>
);
