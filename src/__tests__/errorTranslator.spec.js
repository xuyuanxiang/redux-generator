/**
 * @name
 * @description
 * @version 1.0.0
 * @author xuyuanxiang
 * @date 16/10/9
 */
import translator from '../errorTranslator';

describe('errorTranslator middleware', ()=> {

    let store, next, dispatch, middlewareApplyOptions;

    beforeEach(()=> {
        store = {
            dispatch: ()=> {
            },
            getState: ()=>({})
        };
        next = jasmine.createSpy('next');
        dispatch = (action)=> translator(middlewareApplyOptions || {})(store)(next)(action);
    });

    it("should ignore action is not an error instance.", ()=> {
        dispatch(Error);
        expect(next).toHaveBeenCalledWith(Error);

        dispatch(TypeError);
        expect(next).toHaveBeenCalledWith(TypeError);

        let action = {type: 'DO_SOMETHING', payload: {}};
        dispatch(action);
        expect(next).toHaveBeenCalledWith(action);

        let promise = new Promise(()=> {
        });
        dispatch(promise);
        expect(next).toHaveBeenCalledWith(promise);

        let thunk = ()=> {
        };
        dispatch(thunk);
        expect(next).toHaveBeenCalledWith(thunk);

        let array = new Array(1);
        dispatch(array);
        expect(next).toHaveBeenCalledWith(array);

        dispatch(undefined);
        expect(next).toHaveBeenCalledWith(undefined);

        dispatch(null);
        expect(next).toHaveBeenCalledWith(null);

        dispatch(false);
        expect(next).toHaveBeenCalledWith(false);

        dispatch(-1);
        expect(next).toHaveBeenCalledWith(-1);

        dispatch('');
        expect(next).toHaveBeenCalledWith('');
    });

    it('should translate to FSA standard action with default "type" property value: "ERROR".', ()=> {
        let error = new Error('something was wrong.');
        dispatch(error);
        expect(next).toHaveBeenCalledWith({type: 'ERROR', error: true, payload: error});

        let typeError = new TypeError('invalid parameter.');
        dispatch(typeError);
        expect(next).toHaveBeenCalledWith({type: 'ERROR', error: true, payload: typeError});
    });

    it('should translate to FSA standard action with custom "type" property was set in initial options.', ()=> {
        middlewareApplyOptions = {type: 'ALERT'};
        let error = new Error('something was wrong.');
        dispatch(error);
        expect(next).toHaveBeenCalledWith({type: 'ALERT', error: true, payload: error});
    });


    it('should translate to FSA standard action contain custom "meta" property was set in initial options.', ()=> {
        middlewareApplyOptions = {meta: {notice: 'Something bad was happened! Please try again...'}};
        let error = new Error('something was wrong.');
        dispatch(error);
        expect(next).toHaveBeenCalledWith({
            type: 'ERROR',
            error: true,
            payload: error,
            meta: middlewareApplyOptions.meta
        });
    });

    it('should translate to FSA standard action contain custom "meta" thunk: use the global state to return expected value.', ()=> {
        spyOn(store, 'getState').and.returnValue({current_operation: 'CREATE_USER'});
        middlewareApplyOptions = {
            meta: (error, getState)=> {
                return getState().current_operation;
            }
        };
        let error = new Error('something was wrong.');
        dispatch(error);
        expect(next).toHaveBeenCalledWith({
            type: 'ERROR',
            error: true,
            payload: error,
            meta: 'CREATE_USER'
        });
    });

    it('should translate to FSA standard action contain custom "meta" thunk: using error code to return expected value.', ()=> {
        middlewareApplyOptions = {
            meta: (error, getState)=> {
                switch (error.code) {
                    case 401:
                        return 'Un-Authorization';
                    case 500:
                        return 'System busy';
                }
            }
        };
        let error = new Error('something was wrong.');
        error.code = 401;
        dispatch(error);
        expect(next).toHaveBeenCalledWith({
            type: 'ERROR',
            error: true,
            payload: error,
            meta: 'Un-Authorization'
        });
    });

});