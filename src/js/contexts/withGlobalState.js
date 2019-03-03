import React, { Component } from 'react';

import GlobalContext from './GlobalContext';

const withGlobalState = (InputComponent) =>
  class extends Component {
    render() {
      return (
        <GlobalContext.Consumer>
          {context => (
            !context.loading
            && <InputComponent {...this.props} {...context} />)}
        </GlobalContext.Consumer>
      );
    }
  };

export default withGlobalState;
