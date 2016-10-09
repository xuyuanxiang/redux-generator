/*!
 * This source code is licensed under MIT: http://www.opensource.org/licenses/mit-license.php 
 * Author	Yuanxiang Xu @http://xuyuanxiang.me 
 * Contact	chaos@xuyuanxiang.cn
 */
module.exports = {
    generator: require('./lib/generator'),
    errorTranslator: require('./lib/errorTranslator')
};





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
    error: error, // new Error('Un-Authorization')
    meta: 'Please sign in!'
}
