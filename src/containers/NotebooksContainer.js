import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';

import { fetchNotebooks, selectNotebook } from '../actions/NotebookActions';
import Notebooks from '../components/Notebooks';

class NotebooksContainer extends Component {
  static propTypes = {
    dispatch: PropTypes.func.isRequired,
    notebooks: PropTypes.object,
  };

  componentDidMount() {
    this.props.dispatch(fetchNotebooks());
  }

  handleListSelect = (event, notebookId) => {
    this.props.dispatch(selectNotebook(notebookId));
    // this.setState({
    //   selected: null,
    // });
  };

  render() {
    return (
      <Notebooks
        notebooks={this.props.notebooks}
        onChange={this.handleListSelect}
        rootId="root"
      />
    );
  }
}

function mapStateToProps(state) {
  return {
    notebooks: state.notebooks,
  }
}

export default connect(mapStateToProps)(NotebooksContainer);
