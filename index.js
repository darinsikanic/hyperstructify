exports.middleware = (store) => (next) => (action) => {
  const { ui } = store.getState()
  if (action.type === 'CPANE_TOGGLE') {
    store.dispatch({
      type: 'SESSION_REQUEST',
      effect: () => {
        if (!ui.cSplit) {
          window.rpc.emit('new', {
            splitDirection: 'vertical',
          })
        } else {
          window.rpc.emit('exit', {
            uid: ui.cSplitPane,
          })
        }
      }
    })
    next(action)
  } else if(action.type === 'SESSION_ADD') {
    if (ui.cSplit && !ui.cSplitPane) {
      store.dispatch({
        type: 'CSPLIT_PANE',
        uid: action.uid
      })
    }
    next(action)
  } else if(action.type === 'TERM_GROUP_EXIT') {
    if (!ui.cSplit && ui.cSplitPane) {
      store.dispatch({
        type: 'CSPLIT_PANE',
        uid: null
      })
    }
    next(action)
  } else {
    next(action)
  }
}

exports.reduceUI = (state, action) => {
  switch (action.type) {
    case 'CPANE_TOGGLE':
      return state.set('cSplit', !state.cSplit)
    case 'CSPLIT_PANE':
      return state.set('cSplitPane', action.uid)
    case 'ACE_EDITOR_CHANGE':
      return state.set('content', action.content)
    case 'SET_OUTPUT':
      return state.set('output', action.output)
  }
  return state
}

exports.mapTermsState = (state, map) => {
  return Object.assign(map, {
    content: state.ui.content || "",
    output: state.ui.output || "",
    cSplit: state.ui.cSplit,
    cSplitPane: state.ui.cSplitPane,
  })
}

const passTermGroupProps = (uid, parentProps, props) => {
  return Object.assign(props, {
    content: parentProps.content,
    output: parentProps.output,
    cSplit: parentProps.cSplit,
    cSplitPane: parentProps.cSplitPane,
  })
}

const passTermProps = (uid, parentProps, props) => {
  return Object.assign(props, {
    content: parentProps.content,
    output: parentProps.output,
    cSplit: parentProps.cSplit,
    cSplitPane: parentProps.cSplitPane,
    terms: parentProps.terms,
    activeSession: parentProps.activeSession,
  })
}

exports.getTermGroupProps = passTermGroupProps
exports.getTermProps = passTermProps

exports.decorateMenu = menu => {
  modelMenu = {
    label: 'Toggle Custom Pane',
    accelerator: 'CmdOrCtrl+Shift+M',
    click(item, focusedWindow) {
      focusedWindow && focusedWindow.rpc.emit('toggle-cpane')
    }
  }
  let pluginsMenuIndex = menu.findIndex(item => item.label === 'Plugins')
  menu[pluginsMenuIndex].submenu = menu[pluginsMenuIndex].submenu.concat(modelMenu)
  return menu
}

exports.decorateConfig = (config) => {
  return Object.assign({}, config, {
    css: `
            ${config.css || ''}
            
            .pane {
              width: 100%;
              height: 100%;
              min-width: 200px;
              display: flex;
              flex-direction: column;
              background-color: #6C7A89;
            }

            .button {
              display: inline-block;
              margin: 0;
              padding: 0.75rem 1rem;
              border: 0;
              border-radius: 0.317rem;
              background-color: #aaa;
              color: #fff;
              text-decoration: none;
              font-weight: 700;
              font-size: 1rem;
              line-height: 1.5;
              cursor: pointer;
              -webkit-appearance: none;
              -webkit-font-smoothing: antialiased;
            }
            
            .button:hover {
              opacity: 0.85;
            }
            
            .button:active {
              box-shadow: inset 0 3px 4px hsla(0, 0%, 0%, 0.2);
            }
            
            .button:focus {
              outline: thin dotted #444;
              outline: 5px auto -webkit-focus-ring-color;
              outline-offset: -2px;
            }
        `
  })
}

exports.decorateHyper = (Hyper, {React, notify}) => {
  return class extends React.Component {
    constructor (props, context) {
      super(props, context)
      window.rpc.on('toggle-cpane', () => {
        window.store.dispatch({type: 'CPANE_TOGGLE'})
      })
    }
    render () {
      return <Hyper {...this.props} />
    }
  }
}

const PaneComponent = React => {
  return class Pane extends React.Component {
    constructor(props) {
      super(props)
    }

    render() {
      return (
        <div
        className='pane'
        onClick={this.handleClick}
        onMouseEnter={this.handleMouseEnter}
        onMouseLeave={this.handleMouseLeave}>
        {this.props.children}
      </div>
      )
    }
  }
}

const EditorComponent = React => {
  return class Editor extends React.Component {
    constructor(props) {
      super(props)
      this.onEditorChange = this.onEditorChange.bind(this)
    }

    onEditorChange(newValue) {
      window.store.dispatch({
        type: 'ACE_EDITOR_CHANGE',
        content: newValue
      })
    }

    render() {
      const brace = require('brace')
      const AceEditor = require('react-ace').default
      require('brace/mode/json')
      require('brace/theme/github')
      return (
        <AceEditor
            mode="json"
            theme="github"
            name="input-editor"
            width={`${this.props.width}px`}
            height={`${this.props.height}px`}
            defaultValue={this.props.content}
            value={this.props.content}
            onChange={this.onEditorChange}
            editorProps={{$blockScrolling: true}}
          />
      )
    }
  }
}

const OutputEditorComponent = React => {
  return class OutputEditor extends React.Component {
    constructor(props) {
      super(props)
    }

    render() {
      const brace = require('brace')
      const AceEditor = require('react-ace').default
      require('brace/mode/json')
      require('brace/theme/github')
      return (
        <AceEditor
            mode="json"
            theme="github"
            name="output-editor"
            readOnly={true}
            width={`${this.props.width}px`}
            height={`${this.props.height}px`}
            defaultValue={this.props.output}
            value={this.props.output}
            editorProps={{$blockScrolling: true}}
          />
      )
    }
  }
}

exports.decorateTerm = (Term, {React, notify}) => {
  return class extends React.Component {
    constructor (props, context) {
      super(props, context)
      this.handleParse = this.handleParse.bind(this)
    }

    handleParse(e) {
      const parser = require('structifytextjs')
      if (this.props.cSplit) {
        let activeTerm = null
        if (Object.is(this.props.terms[this.props.activeSession], undefined)) {
          activeTerm= this.props.terms[Object.keys(this.props.terms)[0]]
        } else {
          activeTerm = this.props.terms[this.props.activeSession]
        }
        let selection = ""
        if (activeTerm.term.hasSelection()) {
          selection = activeTerm.term.getSelection()
        } else {
          activeTerm.term.selectAll()
          selection = activeTerm.term.getSelection()
        }
        activeTerm.term.clearSelection()
        if (this.props.content === "") {
          return notify("Create Model first")
        }
        let obj = null
        try {
          obj = JSON.parse(this.props.content)  
        } catch (error) {
          return notify("Invalid JSON in model!")
        }
        let output = ""
        try {
          const parsed = parser.parse(selection, obj)
          output = JSON.stringify(parsed, null, 2)
        } catch (error) {
          console.error("Error occure while passing output to model", error)
          return notify("Parse error occured, check console")
        }
        window.store.dispatch({
          type: 'SET_OUTPUT',
          output: output
        })
      }
    }

    render () {
      if(this.props.uid ===  this.props.cSplitPane && this.props.cSplit) {
        const Pane = PaneComponent(React)
        const Editor = EditorComponent(React)
        const ContainerDimensions = require('react-container-dimensions').default
        const OutputEditor = OutputEditorComponent(React)
        return (
          <Pane>
              <div style={{display: 'flex', flexDirection: 'column', flexBasis: '50%'}}>
                <h2 style={{alignSelf: 'center'}}>Input Model</h2>
                <div style={{width: '100%', height: '100%', alignSelf: 'center'}}>
                  <div style={{margin: '10px', height: '95%'}}>
                  <ContainerDimensions>
                    { ({ width, height }) => {
                      width = width >= window.innerWidth/2 ? 0 : width
                      return <Editor content={this.props.content} width={width} height={height}/>
                    } }
                  </ContainerDimensions>
                  </div>
                </div>
              </div>
              <div style={{display: 'flex', minHeight: '50px', alignItems: 'center'}}>
                <div style={{display: 'flex', flex: 1, justifyContent: 'center'}}>
                  <button className="button" onClick={this.handleParse} style={{marginLeft: '10px', marginRight: 'auto'}}>Parse</button>
                </div>
                <div style={{display: 'flex', flex: 1, justifyContent: 'center'}}>
                  <p>Click to transform terminal output</p>
                </div>
                <div style={{display: 'flex', flex: 1, justifyContent: 'center'}}>
                <span style={{marginLeft: 'auto'}}></span>
                </div>
              </div>
              <div style={{display: 'flex', flexDirection: 'column', flexBasis: '50%'}}>
                <h2 style={{alignSelf: 'center'}}>Structured Output</h2>
                <div style={{width: '100%', height: '100%', alignSelf: 'center'}}>
                  <div style={{margin: '10px', height: '95%'}}>
                  <ContainerDimensions>
                    { ({ width, height }) => {
                      width = width >= window.innerWidth/2 ? 0 : width
                      return <OutputEditor output={this.props.output} width={width} height={height}/>
                    } }
                  </ContainerDimensions>
                  </div>
                </div>
              </div>
          </Pane>
        )
      }
      return <Term {...this.props} />
    }

    shouldComponentUpdate(nextProps, nextState) {
      if ((this.props.uid ===  this.props.cSplitPane && this.props.cSplit) && (this.props.content !== nextProps.content)) {
        return false
      } else {
        return true
      }
    }
  }
}
