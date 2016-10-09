# redux-generator

[Redux](http://redux.js.org/) middleware resolves action which is a [generator function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*).

## Assets
```
                   Asset     Size
      ./lib/generator.js  17.3 kB
./lib/errorTranslator.js  1.08 kB
```

## Coverage
```
--------------------|----------|----------|----------|----------|----------------|
File                |  % Stmts | % Branch |  % Funcs |  % Lines |Uncovered Lines |
--------------------|----------|----------|----------|----------|----------------|
All files           |      100 |    92.31 |      100 |      100 |                |
 errorTranslator.js |      100 |    91.67 |      100 |      100 |                |
 generator.js       |      100 |    92.86 |      100 |      100 |                |
--------------------|----------|----------|----------|----------|----------------|
Test Suites: 2 passed, 2 total
Tests:       15 passed, 15 total
---------------------------------------------------------------------------------------------
  
  generator middleware
  
    Test Suites: 1 passed, 1 total
    Tests:       9 passed, 9 total
    
    ✓ should ignore action is not a function (7ms)
    ✓ should ignore action is not a generator function (2ms)
    ✓ should dispatch plain object yield return value (3ms)
    ✓ should dispatch thunk yield return value (3ms)
    ✓ should dispatch error is thrown by thunk yield and terminal the next yield (3ms)
    ✓ should dispatch promise yield return value (2ms)
    ✓ should dispatch error is rejected by promise yield and terminal the next yield (2ms)
    ✓ should dispatch inner error of generator action (1ms)
    ✓ should resolve action with mixins yields (plain object + thunk + promise). (3ms)

 
  
  errorTranslator middleware
  
    Test Suites: 1 passed, 1 total
    Tests:       6 passed, 6 total
    
    ✓ should ignore action is not an error instance. (9ms)
    ✓ should translate to FSA standard action with default "type" property value: "ERROR". (2ms)
    ✓ should translate to FSA standard action with custom "type" property was set in initial options.
    ✓ should translate to FSA standard action contain custom "meta" property was set in initial options. (2ms)
    ✓ should translate to FSA standard action contain custom "meta" thunk: use the global state to return expected value. (1ms)
    ✓ should translate to FSA standard action contain custom "meta" thunk: using error code to return expected value. (1ms)
  

```

## Get Started

### Install
```
npm install redux-generator --save
```

### Work with react

#### generator middleware

First, apply middleware:
```
import React from 'react';
import {render} from 'react-dom';
import {applyMiddleware, createStore} from 'redux';
import {Provider} from 'react-redux';

// import redux-generator !important
import {generator} from 'redux-generator';
// or
// import generator from 'redux-generator/lib/generator'

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

You can write a action creator like this:

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

    // waterfall#step 3: thunk yield
    let redirect = yield ()=> {
        if (payload && payload.id) {
            return {type: 'ROUTING_POP', payload: `/user/${payload.id}`};
        }
    };

    // waterfall#step 4: Only this ending action will be dispatched after all:
    return redirect;
};
```

It will produce these series of actions as follow:

```
dispatch action:      { type: 'LOADING', payload: 'Loading' }
dispatch action:      { type: 'WILL_SAVE_USER', payload: { lastModified: 1476005411707, name: 'xyx' } }
dispatch action:      { type: 'DID_SAVE_USER', payload: { lastModified: 1476005411707, name: 'xyx', id: '1' } }
dispatch action:      { type: 'ROUTING_POP', payload: '/user/1' }
```

Each action was returned by **syntax** after `yield` will be executed step by step. 

If one of `yield` throws error, the others after it will be terminated.

Both errors, whether `thunk yield` threw or `promise yield` rejected will be dispatched to next middleware. 

You should resolve them in other ways. Such as appending `errorTranslator` middleware after `generator` middleware to handle error.

#### errorTranslator middleware

Set up initial options when applying:

```
import {applyMiddleware, createStore} from 'redux';
import {generator, errorTranslator} from 'redux-generator';
// or:
// import errorTranslator from 'redux-generator/lib/errorTranslator';

// initial middleware apply options
const options = {};

// apply middlewares
applyMiddleware(generator, errorTranslator(options))(createStore)...
```

---

Default options property

```
options = {} or undefefined

// dispatch error in anywhere
store.dispatch(new Error("FOO"));

// the error will be tranlated to:
{
    type: "ERROR",
    error: true,
    payload: error // new Error("FOO")
}
```

---

Custom options property: `type`

```
options = {type: 'ALERT'};

// dispatch error in anywhere
store.dispatch(new Error("FOO"));

// the error will be tranlated to:
{
    type: "ALERT",
    error: true,
    payload: error // new Error("FOO")
}
```

---

Custom options property: `meta`.

```
options = {meta: 'Please try again...'};

// dispatch error in anywhere
let error = new Error("FOO");
store.dispatch(error);

// the error will be tranlated to:
{
    type: "ERROR",
    error: true,
    payload: error, // new Error("FOO")
    meta: 'Please try again...'
}
```

---

+ Use `meta` thunk to get special meta values from **redux global state**.

```
// the redux global state
globalState = {
    last_operation: 'UPDATE_USER'
}

const options = {
    meta: (error, getState)=> {
        const state = getState(); // globalState
        
        if (state.last_operation) {
            return state.last_operation;
        }
    }
}

let error = new Error('FOO');
store.dispatch(error);

let action = {
    type: "ERROR",
    error: true,
    payload: error, // new Error('FOO')
    meta: 'UPDATE_USER'
}
```

---

+ Use `meta` thunk to get special meta value from **different error codes**.

```
let error = new Error('Un-Authorization');
error.code = 401;

const options = {
    meta: (error, getState)=> {
        switch (error.code) {
            case 401:
                return "Please sign in!";
        }
    }
}

let action = {
    type: "ERROR",
    error: true,
    payload: error, // new Error('Un-Authorization')
    meta: 'Please sign in!'
}
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






