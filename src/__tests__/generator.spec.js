/**
 * @name
 * @description
 * @version 1.0.0
 * @author xuyuanxiang
 * @date 16/10/9
 */
global.Promise = require('babel-runtime/core-js/promise');
import generator from "../generator";

describe("generator middleware", ()=> {

    let store, next, dispatch;

    beforeEach(()=> {
        store = {
            dispatch: ()=> {
            },
            getState: ()=>({})
        };
        spyOn(store, 'dispatch');
        next = store.dispatch;
        dispatch = async(action)=> {
            await generator(store)(next)(action);
        }
    });

    it("should ignore action is not a function", async()=> {
        const action = {type: "DO_SOMETHING", payload: {}};
        await dispatch(action);
        expect(next).toHaveBeenCalledWith(action);
    });

    it("should ignore action is not a generator function", async()=> {
        const action = jasmine.createSpy('action');
        await dispatch(action);
        expect(action).toHaveBeenCalledTimes(1);
        expect(action).toHaveBeenCalledWith(store.dispatch, store.getState);
        expect(next).toHaveBeenCalledWith(action);
    });

    it("should dispatch plain object yield return value", async()=> {
        const action = function *() {
            let payload = yield {id: 1}; // plain object
            let action = yield {type: "DO_SOMETHING", payload};
            return action;
        };
        await dispatch(action);
        expect(next).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledWith({type: "DO_SOMETHING", payload: {id: 1}});
    });

    it("should dispatch thunk yield return value", async()=> {
        const fetch = jasmine.createSpy('fetch').and.returnValue({name: 'xyx'});
        const action = function *() {
            let payload = yield fetch; // thunk
            let action = yield {type: "FETCHED", payload};
            return action;
        };
        await dispatch(action);
        expect(next).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledWith({type: "FETCHED", payload: {name: 'xyx'}});
    });

    it("should dispatch error was thrown by thunk yield and terminate the next yield", async()=> {
        const thunk = jasmine.createSpy('thunk').and.throwError("Something bad happened.");
        const action = function *() {
            let payload = yield thunk; // thunk
            let action = yield {type: "FETCHED", payload};
            return action;
        };
        await dispatch(action);
        expect(next).toHaveBeenCalledTimes(1);
        expect(thunk).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledWith(new Error('Something bad happened.'));
    });

    it("should dispatch promise yield return value", async()=> {
        const action = function *() {
            let payload = yield new Promise(resolve=> {
                process.nextTick(()=> {
                    resolve({name: 'abc'});
                });
            }); // promise
            return {type: "FETCHED", payload};
        };
        await dispatch(action);
        expect(next).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledWith({type: "FETCHED", payload: {name: 'abc'}});
    });

    it("should dispatch error was rejected by promise yield and terminate the next yield", async()=> {
        const action = function *() {
            let payload = yield new Promise((resolve, reject)=> {
                process.nextTick(()=> {
                    reject(new Error('Something was wrong.'));
                });
            }); // promise
            return {type: "FETCHED", payload};
        };
        await dispatch(action);
        expect(next).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledWith(new Error('Something was wrong.'));
    });


    it("should dispatch inner error of generator action", async()=> {
        const action = function *() {
            let payload = yield {};
            throw new Error('Something was wrong.');
            return {type: "FETCHED", payload};
        };
        await dispatch(action);
        expect(next).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledWith(new Error('Something was wrong.'));
    });

    it("should resolve action with mixins yields (plain object + thunk + promise).", async()=> {
        const countingFn = jest.fn();
        store.dispatch = (...args) => {
            countingFn(...args);
            process.env.NODE_ENV === 'development' && console.log('**dispatch next\naction:\t', ...args);
        };
        spyOn(store, 'getState').and.returnValue({user: {name: 'xyx'}});
        const action = function *(dispatch, getState) {
            // dispatch an async action
            dispatch({type: 'LOADING', payload: 'Loading'});

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
        dispatch = async(action)=> {
            await generator(store)(store.dispatch)(action);
        }
        await dispatch(action);
        expect(countingFn.mock.calls.length).toBe(4);
        expect(countingFn.mock.calls[3][0]).toEqual({type: 'ROUTING_POP', payload: '/user/1'});
    });

});