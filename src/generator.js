/**
 * @name
 * @description
 * @version 1.0.0
 * @author xuyuanxiang
 * @date 16/10/9
 */
import isFunction from 'lodash/isFunction';
import isUndefined from 'lodash/isUndefined';

export default store => next => action => {
    if (!isFunction(action)) {
        return next(action);
    }
    return new Promise((resolve, reject)=> {
        let generator = action(store.dispatch, store.getState);

        if (isUndefined(generator) || !isFunction(generator.next)) {
            return resolve(action);
        }

        const _resolve = data => {
            try {
                let it = generator.next(data);
                _iterate(it);
            } catch (e) {
                reject(e);
            }
        }

        const _reject = error => {
            try {
                _iterate(generator.throw(error));
            } catch (e) {
                reject(e);
            }
        }

        const _iterate = it => {
            let {done, value} = it || {};
            if (done === true) {
                return resolve(value);
            }
            if (isFunction(value.then)) {
                Promise.resolve(value).then(_resolve, _reject);
            } else if (isFunction(value)) {
                try {
                    _resolve(value());
                } catch (e) {
                    _reject(e);
                }
            } else {
                _resolve(value);
            }
        }
        _resolve();
    }).then(next, error=>next({type: 'ERROR', error: true, payload: error}));
}