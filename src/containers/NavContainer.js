import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import React, { Component, PropTypes } from 'react';

import * as RouterActions from '../actions/RouterActions';
import * as NotebookActions from '../actions/NotebookActions';
import Nav from '../components/Nav';
import NotebookTree from '../components/NotebookTree';

class NavContainer extends Component {
  render() {
    return <Nav {...this.props} />;
  }
}

function mapStateToProps(state) {
  const {
    entities,
		router,
  } = state;
  // FIXME performance
	const rootNotebookIds = Object.keys(entities.notebooks)
    .filter(id => !entities.notebooks[id].parentNotebookId);
  return {
    rootNotebookIds,
    notebooks: entities.notebooks,
    tags: entities.tags,
    ...router.params,
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ ...NotebookActions, ...RouterActions}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(NavContainer);
