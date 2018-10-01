import React, { Component } from 'react';
import { Toolbar, BackButton } from 'react-onsenui';

class Header extends Component {
  render() {
    return (
      <Toolbar>
        <div className={`left ${this.props.back ? '' : 'hidden'}`}><BackButton>Back</BackButton></div>
        <div className="center">{this.props.title}</div>
      </Toolbar>
    );
  }
}

export default Header;
