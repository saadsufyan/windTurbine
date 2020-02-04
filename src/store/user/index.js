// Generate an "initial" store state so you can efficiently reset the state to its initial state.
const initialState = {
    info: {
        username: undefined,
        loggedIn: false,
        home: null,
        homePath: null,
        homeLink: null,
        user: {
            CultureCode: undefined,
			DisplayName: undefined,
            LanguageCode: undefined,
            Email: undefined,
            TimeZoneCode: undefined,
            RotationAnimationTypeID: undefined,
        }
    },
	userNotifications: undefined,
};

// Assign the initial state to the actual state;
let state = Object.assign({}, initialState);

const mutations = {
	// Resets the state to the initial state
	resetState(state) {
		for (let prop in state) {
			state[prop] = initialState[prop];
		}
	},

	setDisplayName(state, name) {
        state.info.user.DisplayName = name;
        localStorage.DisplayName = name;
	},
	setUsername(state, name){
		state.info.username = name;
		localStorage.username = name;
	},
	setData(state, opts) {
		state.info.user = JSON.parse(opts);
		localStorage.user = opts;
	},
	setNotificationData(state, opts) {
		state.userNotifications = JSON.parse(opts);
		localStorage.userNotifications = opts;
	},
	setHomeLink(state, link){
		state.info.home = link;
		localStorage.home = link;
	},
	setHomePath(state, path) {
		state.info.homePath = path;
		localStorage.homePath = path;
	},
	setEmpty(state, path) {
		state.info = {
			username: undefined,
			loggedIn: false,
			home: null,
			homePath: null,
			homeLink: null,
			user: {
				CultureCode: undefined,
                DisplayName: undefined,
				LanguageCode: undefined,
				Email: undefined,
				TimeZoneCode: undefined,
				RotationAnimationTypeID: undefined,
			}
		};
	},
};

const getters = {
	getIsLoggedIn(state){
		if (localStorage.getItem('loggedIn')) {
			return localStorage.getItem('loggedIn');
		}
		return state.info.loggedIn;
	},
	getusername(state) {
		if (state.info.username && state.info.username != undefined) {
			return state.info.username;
		}
		return (localStorage.username) ? localStorage.username : 'Onbekend';
	},
    getDisplayName(state) {
        if (state.info.user && state.info.user.DisplayName && state.info.user.DisplayName != undefined) {
            return state.info.user.DisplayName;
        }
        return (localStorage.DisplayName) ? localStorage.DisplayName : 'Onbekend';
    },
	getUser(state) {
		if (localStorage.getItem('user')) {
			return JSON.parse(localStorage.getItem('user'));
		}
        if (state.info && state.info != undefined) {
            return state.info;
        }
        return {};
	},
	getUserNotifications(state) {
        if (localStorage.getItem('userNotifications')) {
            let data = JSON.parse(localStorage.getItem('userNotifications'));
            return data;
        } else if (state.userNotifications && state.userNotifications != undefined) {
			return state.userNotifications;
		}
		return [];
	},
	getUserProperty: (state) => (prop) => {
        if ( localStorage.user ) {
            let userData = JSON.parse(localStorage.user);
            return (userData[prop]!== undefined) ? userData[prop]: '';
        } else if ( state.info.user && state.info.user[prop] !== undefined) {
            return state.info.user[prop];
        }
        return '';
	},
};

const UserStore = {
	namespaced: true,
	state,
	mutations,
	getters,
};

export default UserStore;
