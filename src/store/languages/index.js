// Generate an "initial" store state so you can efficiently reset the state to its initial state.
const initialState = {
    languages: null,
    local_languages: null,
    currentLang: 'en-gb'
};

// Assign the initial state to the actual state;
const state = Object.assign({}, initialState);

const mutations = {
    // Resets the state to the initial state
    resetState(state)
    {
        for (let prop in state) {
            state[prop] = initialState[prop];
        }
    },

    setLocalData(state, data)
    {

        let lang = 'en-gb';
        if (data.data == 'en-US' || data.data == 'EN') {
            data.data = i18n['en-EN'];
            lang = 'en-gb';
        }
        else if (data.data == 'nl-NL' || data.data == 'NL') {
            data.data = i18n['nl-NL'];
            lang = 'nl-nl';
        }
        else if (data.data == 'de-DE' || data.data == 'DE') {
            data.data = i18n['de-DE'];
            lang = 'de';
        }
        else {
            data.data = i18n['en-EN'];
            lang = 'en-gb';
        }
        global.numeral.locale(lang);
        state.currentLang = lang.toLowerCase();
        localStorage.getItem('currentLang', lang.toLowerCase());

        let translations = {};
        let useData = data.data;

        _.each(useData, (val, idx) => {
            translations[idx] = val;
        });


        state.local_languages = translations;
        localStorage.local_languages = JSON.stringify(translations);
    },
    setData(state, data)
    {
        let translations = {};
        let useData = data.data;

        useData.forEach((val, index) => {
            translations[val.Code] = val.DisplayName;
        });

        state.languages = translations;
        localStorage.languages = JSON.stringify(translations);
    }
};

const getters = {
    getValue: (state, getters) => (id) => {
        if (!state.languages) {
            if (localStorage.languages) {
                state.languages = JSON.parse(localStorage.languages);
            }
        }

        if (state.languages && state.languages[id]) {
            return state.languages[id];
        }

        if (!state.local_languages) {
            if (localStorage.local_languages) {
                state.local_languages = JSON.parse(localStorage.local_languages);
            }
        }
        if (state.local_languages && state.local_languages[id]) {
            return state.local_languages[id];
        }

        // Keep message for debug purposes @request Sander/Walther
        // console.error('Language store getter: no value exists for language id: '+ id);
        return id;
    },
    getCurrentLang: (state) => {

        return state.currentLang;
    }
};

const LanguageStore = {
    namespaced: true,
    state,
    mutations,
    getters,
};

export default LanguageStore;
