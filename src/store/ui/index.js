// Generate an "initial" store state so you can efficiently reset the state to its initial state.
const initialState = {
    ui: null,
    canvas: null,
};

// Assign the initial state to the actual state;
const state = Object.assign({}, initialState);

const mutations = {
    // Resets the state to the initial state
    resetState(state) {
        for (let prop in state) {
            state[prop] = initialState[prop];
        }
    },

    setData(state, data) {
        state.ui = data;
        localStorage.ui = JSON.stringify(data);
    },
};

const getters = {
    getUIByItemCode: (state, getters, rootState, rootGetters) => (itemcode) => {
        let res = false;
        let elements;
        if (localStorage.ui) {
            elements = JSON.parse(localStorage.ui);
        } else {
            elements = state.ui;
        }
        if (elements) {
            res = elements.some((val, idx) => {
                if (val.ItemCode === itemcode) {
                    return true;
                }
            });
        }
        if (res === false) {
            console.warn('UI Element not found with ItemCode: ', itemcode);
        }
        return res;
    },
};

const UIStore = {
    namespaced: true,
    state,
    mutations,
    getters,
};

export default UIStore;
