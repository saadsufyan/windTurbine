import Vue from 'vue';
import Vuex from 'vuex';

import User from './user';
import Languages from './languages';
import NavBar from './navbar';
import Windmills from './windmills';
import Api from './api';
import UI from './ui';
import Inbox from './inbox';

Vue.use(Vuex);

let curDevice = typeof window.device;

const store = new Vuex.Store({
    state: {
        headers: {
            devicecode: curDevice === 'undefined' ? 'browser' : window.device.platform,
            devicevendorcode: curDevice === 'undefined' ? 'chrome' : window.device.uuid,
        }
    },
    mutations: {
        // Specific required API headers for Windup!
        setDeviceCode(state, devicecode)
        {
            // Expects platform
            state.headers.devicecode = devicecode;
        },
        setDeviceVendorCode(state, devicevendorcode)
        {
            state.headers.devicevendorcode = devicevendorcode;
        },
    },
    modules: {
        user: User,
        navbar: NavBar,
        api: Api,
        ui: UI,
        windmills: Windmills,
        languages: Languages,
        inbox: Inbox,
    }
});

export default store;
