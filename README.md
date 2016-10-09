# redux-generator

redux-generator is a middleware for [redux](http://redux.js.org/) to resolve action which is [generator function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*).

## Coverage
```
--------------|----------|----------|----------|----------|----------------|
File          |  % Stmts | % Branch |  % Funcs |  % Lines |Uncovered Lines |
--------------|----------|----------|----------|----------|----------------|
All files     |      100 |    92.86 |      100 |      100 |                |
 generator.js |      100 |    92.86 |      100 |      100 |                |
--------------|----------|----------|----------|----------|----------------|
Test Suites: 1 passed, 1 total
Tests:       9 passed, 9 total

```

## Get Started

### Install
```
npm install redux-generator --save
```

### Work with react

First, apply middleware:
```
import React from 'react';
import {render} from 'react-dom';
import {applyMiddleware, createStore} from 'redux';
import {Provider} from 'react-redux';

// import redux-generator !important
import generator from 'redux-generator';

// components in your project.
import reducers from './path/to/your/reducers';
import App from './path/to/your/app';

// apply redux-generator !important
const createStoreWithMiddleware = applyMiddleware(generator)(createStore);
const store = createStoreWithMiddleware(reducers);

const container = document.createElement('div');
document.body.appendChild(container);
render(<Provider store={store}>
    <App/>
</Provider>, container);
```

You can write action like this:

```
const action = function *(dispatch, getState) {
    // dispatch an async action
    dispatch({type: 'LOADING', payload: 'Loading...'});

    // waterfall#step 1: plain object yield
    let params = yield Object.assign({lastModified: new Date().getTime()}, getState().user);

    // dispatch an async action
    dispatch({type: 'WILL_SAVE_USER', payload: params});

    // waterfall#step 2: promise yield
    let payload = yield new Promise(resolve=> {
        process.nextTick(()=> {
            params.id = '1';
            resolve(params);
        });
    });

    // dispatch an async action
    dispatch({type: 'DID_SAVE_USER', payload});

    // waterfall#step 3: promise yield
    let redirect = yield ()=> {
        if (payload && payload.id) {
            return {type: 'ROUTING_POP', payload: `/user/${payload.id}`};
        }
    };

    // waterfall#step 4: the ending action
    return redirect;
};
```

Each action was returned by `yield` **Syntax** will be executed step by step.

Only the ending(4th) action dispatched after all:
```
dispatch action:      { type: 'LOADING', payload: '正在保存' }
dispatch action:      { type: 'WILL_SAVE_USER', payload: { lastModified: 1476005411707, name: 'xyx' } }
dispatch action:      { type: 'DID_SAVE_USER', payload: { lastModified: 1476005411707, name: 'xyx', id: '1' } }
dispatch action:      { type: 'ROUTING_POP', payload: '/user/1' }
```

*Both of errors threw by `thunk yield` or rejected by `promise yield` will be dispatched to next. You should resolve the errors in other ways.*





