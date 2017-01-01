import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import React, { Component, PropTypes } from 'react';

import NoteList from '../components/NoteList';
import * as RouterActions from '../actions/RouterActions';
import * as NoteActions from '../actions/NoteActions';

class NoteListContainer extends Component {
  render() {
    return (
      <NoteList {...this.props} />
    );
  }
}

function mapStateToProps(state) {
  const {
    entities,
		router,
    note,
    noteList: noteListRef,
  } = state;
	const {
		noteStackType,
		noteStackId,
		noteId,
	} = router.params;

  const props = {
    ...router.params,
    notes: [],
  };
  if (noteStackId && (noteStackType === 'notebook' || noteStackType === 'tag')) {
    const noteList = entities[noteStackType + 's'][noteStackId];
    const order = noteListRef.order;
		props.notes = noteList.noteIds
			.map(noteId => entities.notes[noteId])
      .filter(note => !note.isDeleted && !note.isTrash)
			.sort((note1, note2) => {
				// TODO refactor
				let extractKey = (note) => note[order.key];
				if (order.key.toLowerCase().includes('time')) {
					extractKey = (note) => new Date(note[order.key]);
				}
				const key1 = extractKey(note1);
				const key2 = extractKey(note2);
				return order.ascending ? key1 > key2 : key1 < key2;
			});
    props.noStackId = noteStackId;
    props.noteStackTitle = noteStackType === 'notebook' ? noteList.title : noteList.tag;
  }
  return props;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ ...NoteActions, ...RouterActions}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(NoteListContainer);
