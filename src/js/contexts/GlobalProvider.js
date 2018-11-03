import React, { Component } from 'react';

import GlobalContext from './GlobalContext';

export default class GlobalProvider extends Component {
  state = {
    currentRoom: -1,
  }
  updateState = (prop, value) => {
    this.setState({ [prop]: value });
  }
  render() {
    console.log(this.state);
    return (
      <GlobalContext.Provider value={{
        ...this.state,
        updateState: this.updateState,
      }}
      >
        {this.props.children}
      </GlobalContext.Provider>
    );
  }
}
