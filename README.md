# redux-generator

[![Coverage Status](https://coveralls.io/repos/github/xuyuanxiang/redux-generator/badge.svg)](https://coveralls.io/github/xuyuanxiang/redux-generator)
[![npm version](https://img.shields.io/npm/v/redux-generator.svg?style=flat-square)](https://www.npmjs.com/package/redux-generator)
[![Build Status](https://img.shields.io/travis/xuyuanxiang/redux-generator/master.svg?style=flat-square)](https://travis-ci.org/xuyuanxiang/redux-generator)

A middleware for [redux](http://redux.js.org/), allows to dispatch an action which is a [generator function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*).

## Get Started

### Installation

```bash
npm install redux-generator --save
```

### Usage

First, apply middleware:

```javascript
import {applyMiddleware, createStore} from 'redux';

// import redux-generator
import {generator} from 'redux-generator';
// or
// import generator from 'redux-generator/lib/generator'

// reducers in your project.
import reducers from './path/to/your/reducers';

// apply redux-generator
const createStoreWithMiddleware = applyMiddleware(generator)(createStore);
const store = createStoreWithMiddleware(reducers);
```

You can write an action creator like this:

```javascript
// in ./actions/userActionsCreator.js
export const doSaveUser = (user) => {
    return function *(dispatch, getState) {
        // async dispatch an action
        dispatch({type: 'LOADING', payload: 'Loading...'});

        // sync waterfall: a plain object yield
        let params = yield Object.assign({}, user, {lastModified: new Date().getTime()});

        // async dispatch an action
        dispatch({type: 'WILL_SAVE_USER', payload: params});

        // sync waterfall: a promise yield
        let payload = yield new Promise(resolve=> {
            process.nextTick(()=> {
                params.id = '1';
                resolve(params);
            });
        });

        // async dispatch an action
        dispatch({type: 'DID_SAVE_USER', payload});

        // sync waterfall: a thunk yield
        let redirect = yield ()=> {
            if (payload && payload.id) {
                return {type: 'ROUTING_POP', payload: `/user/${payload.id}`};
            }
        };

        // Only this ending action will be dispatched by generator middleware after all
        return redirect;
    };
} 
```

Dispatch in anywhere:

```javascript
import {doSaveUser} from './actions/userActionsCreator';
store.dispatch(doSaveUser({name: 'xyx'}));
````

These series of actions as follow will be dispatched one by one:

```
dispatch action:      { type: 'LOADING', payload: 'Loading' }
dispatch action:      { type: 'WILL_SAVE_USER', payload: { lastModified: 1476005411707, name: 'xyx' } }
dispatch action:      { type: 'DID_SAVE_USER', payload: { lastModified: 1476005411707, name: 'xyx', id: '1' } }
dispatch action:      { type: 'ROUTING_POP', payload: '/user/1' }
```

Each action was returned by **syntax** followed `yield` will be executed step by step. If one of `yield` throws error, the others behind will be terminated.

Both errors, whether `thunk yield` threw or `promise yield` rejected will be translated to [FSA standard](https://github.com/acdlite/flux-standard-action) error action and dispatched:
```javascript
import {applyMiddleware, combineReducers, createStore} from 'redux';
import generator from 'redux-generator';

const user = (state = {}, action)=> {
    console.log('action>>>reducer:\t', action);
    return state;
}
const reducers = combineReducers({user});
const store = applyMiddleware(generator)(createStore)(reducers);

// action>>>reducer:    { type: 'ERROR', error: true, payload: [Error: foo] }
store.dispatch(function *action() {
    let payload = yield () => {
        throw new Error('foo');
    }

    // never be executed
    let redirect = yield {type: 'ROUTING_POP', payload};
    return redirect;
});

// action>>>reducer:    { type: 'ERROR', error: true, payload: [Error: bar] }
store.dispatch(function *action() {
    let payload = yield new Promise((resolve, reject)=> {
        process.nextTick(()=>reject(new Error('bar')));
    });

    // never be executed
    let redirect = yield {type: 'ROUTING_POP', payload};

    return redirect;
});

// action>>>reducer:    { type: 'ERROR', error: true, payload: [Error: Inner error] }
store.dispatch(function *action() {
    throw new Error('Inner error');

    // never be executed
    let params = yield ()=> {
        return {name: 'xyx'};
    }

    // never be executed
    let payload = yield new Promise((resolve)=> {
        process.nextTick(()=>resolve(Object.assign(params, {id: 1})));
    });
    return {type: "SAVE", payload};
});
```



## Contribution

### test
```
npm test
```

### build
```
npm run release
```