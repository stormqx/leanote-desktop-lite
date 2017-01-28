import React, { Component, PropTypes } from 'react';

import NotebookTree from '../components/NotebookTree';
import TagList from '../components/TagList';
import ProfileContainer from '../containers/ProfileContainer';

class Nav extends Component {
  static propTypes = {
    notebooks: PropTypes.object.isRequired,
    noteStackId: PropTypes.string,
    noteStackType: PropTypes.string,
    rootNotebookIds: PropTypes.array.isRequired,
    selectNoteStack: PropTypes.func.isRequired,
    tagIds: PropTypes.array,
  };

  render() {
    const {
      notebooks,
      tagIds,
      noteStackId,
      noteStackType,
      rootNotebookIds,
      selectNoteStack,
    } = this.props;
    return (
      <div className="nav">
        <NotebookTree
          notebooks={notebooks}
          noteStackId={noteStackId}
          noteStackType={noteStackType}
          rootNotebookIds={rootNotebookIds}
          selectNoteStack={selectNoteStack}
        />
        <TagList
          noteStackId={noteStackId}
          noteStackType={noteStackType}
          tagIds={tagIds}
        />
				<ProfileContainer />
      </div>
    );
  }
}

export default Nav;
