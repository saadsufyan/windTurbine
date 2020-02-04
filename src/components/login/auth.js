import store from '../../store';

const Auth = {};

Auth.resetData = function () {
    // Get all modules available and commit the action resetState;
    for (let key in store._modulesNamespaceMap) {
        store.commit(key + 'resetState');
    }
    localStorage.clear();
};

Auth.login = function () {

    window.axios.defaults.headers = store.state.headers;

    let username = store.state.api.instance.headers.login;
    let password = store.state.api.instance.headers.pwd;

    //if username and password in store are false, try to get them from localStorage
    if (!username && localStorage.getItem('username') !== null) {
        username = localStorage.getItem('username');
    }

    if (!password && localStorage.getItem('password') !== null) {
        password = localStorage.getItem('password');
    }

    //set headers
    window.axios.defaults.headers.login = username;
    window.axios.defaults.headers.pwd = password;

    // Apparently the token still is sent when undefined or null, API does not handle this correctly.
    delete window.axios.defaults.headers.token;

    // Communicate to api;
    return new Promise(function (resolve, reject) {
        window.axios.get('Session/Validate')
            .then(function (response) {
                let data = response.data;
                let result = data.SessionValidateResult[0].Result;
                if (result == 'Ok') {
                    localStorage.setItem('username', username);
                    localStorage.setItem('password', password);

                    let resultData = data.Session[0];
                    // Commit token to store / localstorage
                    store.commit('api/setToken', resultData.Token);
                    localStorage.setItem('loggedIn', true);
                    store.state.user.loggedIn = true;

                    window.axios.defaults.headers.token = store.state.api.instance.headers.token;
                    if (localStorage.token) {
                        window.axios.defaults.headers.token = localStorage.token;
                    }
                    resolve(data);
                } else {
                    reject(result);
                }
            })
            .catch(function (error) {
                reject(error);
            });
    });
};
/**
 *
 * @returns {Promise<any>}
 */
Auth.checkAuth = function () {
    window.axios.defaults.headers = store.state.headers;
    window.axios.defaults.headers.token = store.state.api.instance.headers.token;

    if (localStorage.token) {
        window.axios.defaults.headers.token = localStorage.token;
    }

    // Communicate to api;
    return new Promise((resolve, reject) => {
        // Check if token is still valid
        let currentDate = new Date();
        let expiration_date = new Date(localStorage.token_expiration);
        let tokenValid = (localStorage.token && currentDate <= expiration_date);

        if (tokenValid === true) {
            resolve(true);
        } else {
            return this.login()
                .then((response) => {
                    resolve(true);
                })
                .catch((error) => {
                    console.error('error relogin in checkAuth ', error);
                    reject(false);
                });
        }
    });
};

export default Auth;
