import React, { Component } from 'react';
import { css } from 'react-emotion';

import withGlobalState from '../../contexts/withGlobalState';

class SendMessageForm extends Component {
  state = {
    message: '',
  }

  handleChange = (e) => {
    this.setState({
      message: e.target.value,
    });
  }

  handleSubmit = (e) => {
    const { message } = this.state;
    const { sendMessage } = this.props;
    e.preventDefault();
    sendMessage(message);
    this.setState({ message: '' });
  }

  render() {
    return (
      <form
        onSubmit={this.handleSubmit}
        className={SendMessageFormStyle}
      >
        <input
          onChange={this.handleChange}
          value={this.state.message}
          placeholder="Type your message and hit ENTER"
          type="text"
        />
      </form>
    );
  }
}

const SendMessageFormStyle = css`
  background: var(--send-message-form);
  display: flex;
  box-sizing: border-box;
  height: 60px;
  & input {
    width: 100%;
    padding: 15px 10px;
    border: none;
    margin: 0;
    background: var(--send-message-form);
    font-weight: 200;
  }
  & input:focus {
    outline-width: 0;
  }
  & input::placeholder {
    color: black;
  }
`;

export default withGlobalState(SendMessageForm);
