// Generate an "initial" store state so you can efficiently reset the state to its initial state.
const initialState = {
    messages: null,
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

    setData(state, data){
        state.messages = data;
        localStorage.messages = JSON.stringify(data);
    },
};

const getters = {
    getMessageById: (state, getters, rootState, rootGetters) => (messageId) => {
        let res = false;
        let elements;
        if (localStorage.messages) {
            elements = JSON.parse( localStorage.messages);
        } else {
            elements = state.messages;
        }
        if (elements) {
            res = elements.filter((val, idx) => {
                if ( val.ID === parseInt(messageId) ) {
                    return val;
                }
            });
        }
        if (res.length == 0) {
            console.warn('Message not found with id: ', messageId);
        } else {
            res = res[0];
        }
        return res;
    },
};

const InboxStore = {
    namespaced: true,
    state,
    mutations,
    getters,
};

export default InboxStore;
