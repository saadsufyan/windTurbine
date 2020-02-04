// Generate an "initial" store state so you can efficiently reset the state to its initial state.
const initialState = {
    windowTitle: 'Windparken',
    showNavBar: true,
    tabLabel1: '',
    showTabBar: false,
    showLoading: false,

    searchType: 'parks',
    searchId: null,
    searchQuery: '',
    showSideMenu: false,
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


	changeWindowTitle(state, title){
		state.windowTitle = title;
	},
	setSearchType(state, type){
		state.searchType = type;
	},
    setSearchId(state, id) {
        state.searchId = id;
    },
    setSearchQuery(state, query) {
	    state.searchQuery = query;
    },
	showNavBar(state, show) {
		state.showNavBar = show;
	},
	showLoading(state,value) {
		state.showLoading = value;
	},
    showSideMenu(state, value) {
	    state.showSideMenu = value;
    }
};

const getters = {
    getSearchType(state){
        return state.searchType;
    },
    getSearchId(state){
        return state.searchId;
    },
    getSearchQuery(state){
        return state.searchQuery;
    },
    getShowSideMenu(state) {
        return state.showSideMenu;
    }
};

const NavStore = {
	namespaced: true,
	state,
	mutations,
	getters,
};

export default NavStore;
