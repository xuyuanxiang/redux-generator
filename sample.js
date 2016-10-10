import {applyMiddleware, combineReducers, createStore} from 'redux';
import generator from './lib/generator';

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

