// Generate an "initial" store state so you can efficiently reset the state to its initial state.
const initialState = {
    instance: {
        baseURL: 'https://api.windup.pro/api/',
        headers: {},
    },
}

// Assign the initial state to the actual state;
const state = Object.assign({}, initialState);

const mutations = {
    // Resets the state to the initial state
    resetState(state) {
        for (let prop in state) {
            state[prop] = initialState[prop];
        }
    },

    setBaseUrl(state, name) {
        state.baseUrl = url;
        state.instance.baseUrl = url;
    },
    setToken(state, token) {
        state.instance.headers.token = token;

        // Write to localstorage
        localStorage.token = token;
        localStorage.token_save_date = new Date();

        // Set custom expiration date; API does not deliver this
        let expiration_date = new Date();
        expiration_date.setHours(expiration_date.getHours() + 1);

        localStorage.token_expiration = expiration_date;
    },
    setLogin(state, login) {
        state.instance.headers.login = login;
    },
    setPassword(state, password) {
        state.instance.headers.pwd = password;
        localStorage.setItem('password', password);
    }
};

const ApiStore = {
    namespaced: true,
    state,
    mutations,
};

export default ApiStore;