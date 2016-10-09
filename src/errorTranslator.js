/**
 * @name
 * @description
 * @version 1.0.0
 * @author xuyuanxiang
 * @date 16/10/9
 */
const isError = value => {
    return (Object.prototype.toString.call(value) == '[object Error]') ||
        (value && typeof value.message == 'string' && typeof value.name == 'string');
}

export default ({type, meta})=> store => next => action=> {
    if (!isError(action)) {
        return next(action);
    }
    const _action = {type: type || 'ERROR', error: true, payload: action};

    if (typeof meta === 'function') {
        meta = meta(action, store.getState);
    }

    if (typeof meta !== 'undefined') {
        _action.meta = meta;
    }

    next(_action);
}
