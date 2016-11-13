import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import React, { Component, PropTypes } from 'react';

import HeaderContainer from '../containers/HeaderContainer';
import Nav from '../components/Nav';
import NoteContainer from '../containers/NoteContainer';
import NoteListContainer from '../containers/NoteListContainer';
import * as UserActionCreators from '../actions/UserActions';

const { ipcRenderer } = require('electron');

class Main extends Component {
  static propTypes = {
    autologin: PropTypes.func.isRequired,
  };

  state = {
    authed: false,
  };

  componentWillMount() {
    this.props.autologin()
      .then(() => {
        this.setState({
          authed: true,
        });
        setTimeout(() => {
          ipcRenderer.send('main-window-ready');
        });
      }, () => {
        ipcRenderer.send('auth-requested');
      });
  }

  render() {
		if (this.state.authed) {
			return (
				<div className="main-page">
					<HeaderContainer />
					<div className="content">
						<Nav />
						<NoteListContainer />
						<NoteContainer />
					</div>
				</div>
			);
		}
		return null;
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(UserActionCreators, dispatch);
}

export default connect(() => ({}), mapDispatchToProps)(Main);
