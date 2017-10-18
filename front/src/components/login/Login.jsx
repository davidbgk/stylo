import React, { Component } from 'react';
import { Link } from 'react-router-dom';

export default class Login extends Component {
  constructor(props) {
    super(props);
  }
  handleSubmit = function(e){
    e.preventDefault();
  }


  render() {
    return (
      <div className="gridCenter">
        <form className="gridCentered" onSubmit={this.handleSubmit}>
          <input type="text" placeholder="email"/>
          <input type="password" placeholder="password"/>
          <input type="submit" value="go" />
          <p className="note">or <Link to="/register">create an account</Link></p>
        </form>
      </div>
    );
  }
}
