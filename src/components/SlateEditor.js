import MarkupIt, { BLOCKS, INLINES, TABLE_ALIGN, MARKS, CONTAINERS, VOID } from 'markup-it';
import markdown from 'markup-it/lib/markdown';
import React, { Component, PropTypes } from 'react';
import Slate, { Editor, State, Text, Inline, Block } from 'slate';

import schema from '../constants/SlateSchema';

const OPTIONS = { normalize: false };
const linkRegex = /\[([^\]]*)\]\(([^\)]*)\)/;

class SlateEditor extends Component {
  static propTypes = {
    note: PropTypes.object,
    onChange: PropTypes.func.isRequired,
  };

  state = {
    state: deserializeToState(''),
  };

  componentWillReceiveProps(nextProps) {
    if (!nextProps.note.isMarkdown) {
      console.error('Only markdown note is supported');
      return;
    }

    this.setState({
      state: deserializeToState(nextProps.note.content),
    });
  }

  render() {
    return (
      <div className="editor">
        <Editor
          className="slate-editor markdown-body"
          onBlur={this.onBlur}
          onChange={this.onChange}
          onDocumentChange={this.onDocumentChange}
          onKeyDown={this.onKeyDown}
          onPaste={this.onPaste}
          onSelectionChange={this.onSelectionChange}
          placeholder="Enter text here..."
          ref="slate"
          schema={schema}
          state={this.state.state}
        />
      </div>
    )
  }

  onPaste = () => {
    // 粘贴的图片都上传
  }

  onSelectionChange = (selection, state) => {
    const initialState = state;
    const { startBlock, startOffset, startText } = state;
    let parent = state.document.getParent(startText.key);
    const prev = state.document.getPreviousSibling(startText.key);
    const isPrevLink = prev && prev.type === INLINES.LINK && selection.startOffset === 0;
    const next = state.document.getNextSibling(startText.key);
    const isNextLink = next && next.type === INLINES.LINK && selection.startOffset === state.startText.length;
    if (parent.type === INLINES.LINK || isPrevLink || isNextLink) {
      if (isPrevLink) {
        // 遇到换行，将selection移动到换行之前的text
        state = state.transform()
          .collapseToEndOfPreviousText()
          .apply(OPTIONS);
      } else if (isNextLink) {
        state = state.transform()
          .collapseToStartOfNextText()
          .apply(OPTIONS);
      }
      parent = state.document.getParent(state.startText.key);
      // 用户进入一个link，将link替换成markdown源码
      if (parent.type === INLINES.LINK) { // 还没有被转成源码
        if (!linkRegex.exec(parent.text)) {
          state = state.transform()
            .collapseToStartOf(state.startText)
            .extendToEndOf(state.startText)
            .delete()
            .insertInline(Inline.create({
              data: { href: parent.data.get('href') },
              type: INLINES.LINK,
              nodes: [ Text.createFromString(`[${parent.text}](${parent.data.get('href')})`) ]
            }), OPTIONS)
            .apply(OPTIONS);
          setTimeout(() => {
            this.setState({ state: state });
          });
        }

        setTimeout(() => {
          const nextState = this.convertSrcToLink(state);
          if (nextState !== state) {
            this.setState({ state: nextState });
          }

          this.prevStartText = state.startText;
          this.prevParent = state.document.getParent(state.startText.key);
        });
      }
    } else {
      // 刚刚编辑完一个link，将markdown源码解析成link，目前只允许按顺序写link
      const match = linkRegex.exec(startText.text);
      if (match) {
        state = state.transform()
          .extendBackward(match[1].length + match[2].length + 4)
          .delete()
          .insertInline(Inline.create({
            data: { href: match[2] },
            type: INLINES.LINK,
            nodes: [ Text.createFromString(`[${match[1]}](${match[2]})`) ]
          }))
          .collapseToEndOfNextText()
          .apply(OPTIONS);
        setTimeout(() => { // 谜之setTimeout
          this.setState({ state: state });
        });
        this.prevStartText = state.document.getPreviousText(state.startText.key);
        this.prevParent = state.document.getParent(this.prevStartText.key);
      }
    }
    // TODO 重复代码
    setTimeout(() => {
      const nextState = this.convertSrcToLink(state);
      if (nextState !== state) {
        this.setState({ state: nextState });
      }
    });
  }

  // 离开src格式的link，转成anchor
  convertSrcToLink = (state) => {
    parent = state.document.getParent(state.startText.key);
    const previous = state.document.getPreviousText(state.startText.key);
    if (previous && this.prevStartText && previous.key === this.prevStartText.key && state.startText.text.length === 0) return state;
    if (this.prevParent && this.prevParent.type === INLINES.LINK && (this.prevParent.key !== parent.key || !state.selection.isFocused)) {
      const match = linkRegex.exec(this.prevParent.text)
      const nextState = state.transform()
        .setNodeByKey(this.prevParent.key, { data: { href: match[2] } })
        .removeNodeByKey(this.prevStartText.key)
        .insertNodeByKey(this.prevParent.key, 0, Text.createFromString(match[1]))
        .apply(OPTIONS);
      this.prevStartText = state.startText;
      this.prevParent = state.document.getParent(this.prevStartText.key);
      return nextState;
    }
    return state;
  }

  onBlur = () => {
    // onBlur在onSelectionChange之前
    setTimeout(() => {
      const text = serializeState(this.state.state);
      if (text !== this.props.note.content) {
        this.props.onChange(text);
      }
    }, 100);
  }

  onChange = (state) => {
    const { startBlock, startOffset, startText, selection } = state;
    this.setState({ state });
  }

  onKeyDown = (e, data, state) => {
    switch (data.key) {
      case 'space': return this.onSpace(e, state);
      case 'backspace': return this.onBackspace(e, state);
      case 'enter': return this.onEnter(e, state);
    }
  }

  /**
   * Get the block type for a series of auto-markdown shortcut `chars`.
   *
   * @param {String} chars
   * @return {String} block
   */
  getType = (chars) => {
    switch (chars) {
      case '*':
      case '-':
      case '+': return BLOCKS.LIST_ITEM;
      case '>': return BLOCKS.BLOCKQUOTE;
      case '#': return BLOCKS.HEADING_1;
      case '##': return BLOCKS.HEADING_2;
      case '###': return BLOCKS.HEADING_3;
      case '####': return BLOCKS.HEADING_4;
      case '#####': return BLOCKS.HEADING_5;
      case '######': return BLOCKS.HEADING_6;
      default: return null;
    }
  }

  /**
   * On space, if it was after an auto-markdown shortcut, convert the current
   * node into the shortcut's corresponding type.
   *
   * @param {Event} e
   * @param {State} state
   * @return {State or Null} state
   */
  onSpace = (e, state) => {
    if (state.isExpanded) return;
    const { startBlock, startOffset } = state;
    const chars = startBlock.text.slice(0, startOffset).replace(/\s*/g, '');
    const type = this.getType(chars);

    if (!type) return;
    if (type == BLOCKS.LIST_ITEM && startBlock.type == BLOCKS.LIST_ITEM) return;
    e.preventDefault();

    let transform = state
      .transform()
      .setBlock(type);

    if (type == BLOCKS.LIST_ITEM) transform.wrapBlock(BLOCKS.UL_LIST);

    state = transform
      .extendToStartOf(startBlock)
      .delete()
      .apply();

    return state;
  }

  /**
   * On backspace, if at the start of a non-paragraph, convert it back into a
   * paragraph node.
   *
   * @param {Event} e
   * @param {State} state
   * @return {State or Null} state
   */
  onBackspace = (e, state) => {
    if (state.isExpanded) return;
    if (state.startOffset != 0) return;
    const { startBlock } = state;

    if (startBlock.type == BLOCKS.PARAGRAPH) return;
    e.preventDefault();

    let transform = state
      .transform()
      .setBlock(BLOCKS.PARAGRAPH);

    if (startBlock.type == BLOCKS.LIST_ITEM) transform.unwrapBlock(BLOCKS.UL_LIST);

    state = transform.apply();
    return state;
  }

  /**
   * On return, if at the end of a node type that should not be extended,
   * create a new paragraph below it.
   *
   * @param {Event} e
   * @param {State} state
   * @return {State or Null} state
   */
  onEnter = (e, state) => {
    if (state.isExpanded) return;
    const { startBlock, startOffset, endOffset } = state;
    if (startOffset == 0 && startBlock.length == 0) return this.onBackspace(e, state);
    if (endOffset != startBlock.length) return;

    if (
      startBlock.type != BLOCKS.HEADING_1 &&
      startBlock.type != BLOCKS.HEADING_2 &&
      startBlock.type != BLOCKS.HEADING_3 &&
      startBlock.type != BLOCKS.HEADING_4 &&
      startBlock.type != BLOCKS.HEADING_5 &&
      startBlock.type != BLOCKS.HEADING_6 &&
      startBlock.type != BLOCKS.BLOCKQUOTE
    ) {
      return;
    }

    e.preventDefault();
    return state
      .transform()
      .splitBlock()
      .setBlock(BLOCKS.PARAGRAPH)
      .apply();
  }
}

/**
 * Transform Slate.state to markdown
 */
function serializeState(state) {
  const text = MarkupIt.State.create(markdown).serializeDocument(state.document);
  return text;
}

/**
 * Transform markdown to Slate.state
 */
function deserializeToState(text) {
  const document = MarkupIt.State.create(markdown).deserializeToDocument(text);
  const state = Slate.State.create({ document });
  return state;
}

function prettify(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export default SlateEditor;
