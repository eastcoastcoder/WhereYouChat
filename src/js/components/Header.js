import React from 'react';
import { Toolbar, BackButton } from 'react-onsenui';

const Header = ({ back, title }) => (
  <Toolbar>
    <div className={`left ${back ? '' : 'hidden'}`}><BackButton>Back</BackButton></div>
    <div className="center">{title}</div>
  </Toolbar>
);

export default Header;
