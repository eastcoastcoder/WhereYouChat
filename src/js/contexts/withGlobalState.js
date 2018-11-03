import React, { Component } from 'react';
import GlobalContext from './GlobalContext';

export default function withGlobalState(InputComponent) {
  return class extends Component {
    render() {
      return (
        <GlobalContext.Consumer>
          {context => (
            <InputComponent {...this.props} {...context} />)}
        </GlobalContext.Consumer>
      );
    }
  };
}
