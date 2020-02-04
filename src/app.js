import * as intersection from 'intersection-observer';

import 'babel-polyfill';
// GET DEPENDENCIES
import Vue from 'vue';
import App from './App.vue';
import "babel-polyfill";
import VueMaterial from 'vue-material';
import TweenMax from 'gsap';
import axios from 'axios';
import $ from 'jquery';
import '@/styles/build.scss';
import customSelect from 'custom-select';
import VuePullRefresh from 'vue-pull-refresh';
import _ from 'lodash';
import VueObserveVisibility from 'vue-observe-visibility';
import MarkerClusterer from 'gmaps-marker-clusterer';
import GoogleMaps from 'google-maps';

GoogleMaps.KEY = 'AIzaSyCDcyjvEVR2q8dXv0wsGF2NfCa-XZaGSjE';

import FastClick from 'fastclick';

import infiniteScroll from 'vue-infinite-scroll';
import TouchMenuLA from './lib/touch-menu/touch-menu-la.js';

Vue.use(infiniteScroll);
Vue.use(VueObserveVisibility);
Vue.use(VueMaterial);

import HammerJS from 'hammerjs';
import i18n from './i18n';
import router from './routes';
import store from './store';
import auth from './components/login/auth.js';
import windmillClass from './components/windmill/windmill.js';

import hexagon from './components/hexagon/hexagon.vue';
import CountUp from 'countup';
import helpers from './helpers.js';
import config from '@/lib/config.js';

global.helpers = helpers;
global.TouchMenuLA = TouchMenuLA;
global.TweenMax = TweenMax;
global.$ = $;
global.config = config;

global.customSelect = customSelect;

global.auth = auth;
global.hexagon = hexagon;
global.windmillClass = windmillClass;
global._ = _;
global.CountUp = CountUp;
global.VuePullRefresh = VuePullRefresh;
global.i18n = i18n;
global.GoogleMaps = GoogleMaps;
global.HammerJS = HammerJS;

let instance = axios.create(store.state.api.instance);
window.axios = instance;

//locale number formatting
import numeral from 'numeral';

global.numeral = numeral;
global.numeral.register('locale', 'nl-nl', config.numeral.nl);
global.numeral.register('locale', 'en-gb', config.numeral.en);
// DEV
Vue.config.debug = true;
let mixinsMethods = {
    getTranslation: function (key) {

        if (store.getters['languages/getValue'](key)) {
            return store.getters['languages/getValue'](key);
        } else {
            return key;
        }
    },
    OS_IOS()
    {
        return window.cordova && window.cordova.platformId === 'ios';
    },
    checkLanguage: function () {
        return new Promise((resolve, reject) => {
            if (navigator && navigator.globalization) {
                navigator.globalization.getPreferredLanguage(
                    function (language) {
                        resolve(language.value);
                    },
                    function (error) {
                        reject(error);
                    },
                );

            } else {
                resolve('en');//default english
            }
        });
    },
    setLanguage()
    {

        this.checkLanguage()
            .then((language) => {
                this.$store.commit('languages/setLocalData', {data: language});

            })
            .catch((error) => {
                this.$store.commit('languages/setLocalData', {data: 'en-EN'});
                console.error(error);
            });
    },
    alert(title, message = '')
    {
        if (window.cordova) {
            navigator.notification.alert(
                message,
                null,
                title,
                'OK',
            );
        } else {
            alert(message);
        }
    },
    getNotifications()
    {
        return new Promise((resolve, reject) => {
            if (store.getters['user/getIsLoggedIn'] == 'true') {
                window.axios.get('Session/CurrentUser/Inbox')
                    .then(response => {
                        if (response.data && response.data.UserInboxResult) {

                            _.each(response.data.UserInboxResult, (val) => {
                                if (!val.UTCReadDate) {
                                    return resolve(true);
                                }
                            });
                            resolve(false);
                        }
                    })
                    .catch((err) => {
                        console.error('error getting user inbox ', err);
                        reject(err);
                    });
            } else {
                return reject('No access to get notifications');
            }

        });
    },

    getHomeLink(state)
    {
        let userState;
        if (localStorage.user) {
            userState = JSON.parse(localStorage.user);
        } else {
            userState = store.getters['user/getUser'];
        }

        if (userState && userState.ParkCount && userState.ParkCount == 1) {
            // If user has one park, check if has multiple turbines
            // If only one turbine is available, automatically link to that detail page.
            if (userState.TurbineCount == 1) {
                return '/turbine/' + userState.FirstTurbineID;
            }
            return '/overview/' + userState.FirstParkGroupID;
        }
        // If user has more than 1 park, return overview
        return '/overview';
    },
    getHomePath(state)
    {
        let userState;
        if (localStorage.user) {
            userState = JSON.parse(localStorage.user);
        } else {
            userState = store.getters['user/getUser'];
        }

        if (userState && userState.ParkCount && userState.ParkCount == 1) {
            // If user has one park, check if has multiple turbines
            // If only one turbine is available, automatically link to that detail page.
            if (userState.TurbineCount == 1) {
                return 'turbinedetails';
            }
            return 'parkoverview';
        }
        // If user has more than 1 park, return overview
        return 'overview';
    },
    generateCountUpOptions(number, forceDecimals)
    {
        return helpers.getCountUpOptions(number, store.getters['languages/getCurrentLang'], forceDecimals);
    },
    /**
     * add/set eventListener on document (
     * @param {String} listener
     * @param {String}  event
     * @param {Function} callback
     * @param {Object|Boolean} [options]
     */
    setDocumentEventListener(listener, event, callback, options = false)
    {
        if (listener && event && callback) {
            document[listener](event, callback, options);
        }
    },
    /**
     * dispatch method to add events on resign/pause and active/resume events on document
     * @param {Function} pauseCallback
     * @param {Function} resumeCallback
     * @param {Object|Boolean} [options]
     */
    addAppPauseResumeListeners(pauseCallback, resumeCallback, options = false)
    {
        let listener = 'addEventListener';
        let isIOS = this.OS_IOS();

        let pauseEvent = isIOS ? 'resign' : 'pause';
        this.setDocumentEventListener(listener, pauseEvent, pauseCallback, options);

        let resumeEvent = isIOS ? 'active' : 'resume';
        this.setDocumentEventListener(listener, resumeEvent, resumeCallback, options);
    },
    /**
     * dispatch method to remove eventlisteners from document for pause/resign and resume/active
     * @param {Function} pauseCallback
     * @param {Function} resumeCallback
     * @param {Object|Boolean} [options]
     */
    removeAppPauseResumeListeners(pauseCallback, resumeCallback, options = false)
    {
        let listener = 'removeEventListener';
        let isIOS = this.OS_IOS();

        let pauseEvent = isIOS ? 'resign' : 'pause';
        this.setDocumentEventListener(listener, pauseEvent, pauseCallback, options);

        let resumeEvent = isIOS ? 'active' : 'resume';
        this.setDocumentEventListener(listener, resumeEvent, resumeCallback, options);
    }
};
const mixins = {
    methods: {...helpers, ...mixinsMethods},
};

Vue.mixin(mixins);

//DEFINE APP
const app = new Vue({
    router,
    store,
    ...App,
    data()
    {
        return {
            barStatus: 'error',
        };
    },
    beforeDestroy()
    {
        //remove eventListeners on destroy.
        if (this.OS_IOS()) {
            document.removeEventListener('active', checkAuth, false);
        }
        else {
            document.removeEventListener('resume', checkAuth, false);
        }
    },
    mounted()
    {
        this.setLanguage();

        if ('addEventListener' in document) {
            document.addEventListener('DOMContentLoaded', function () {
                FastClick.attach(document.body);
            }, false);

            if (this.OS_IOS()) {
                document.addEventListener('active', checkAuth, false);
            }
            else {
                document.addEventListener('resume', checkAuth, false);
            }
        }
    },
});

/**
 * check auth on resume/active to be sure we have a valid api key.
 */
function checkAuth()
{
    //check if we still have a valid token, if we do, it's all good. if we don't, checkauth will try to relogin, if
    // that fails we will redirect to loginform
    auth.checkAuth()
        .catch((error) => {
            console.error("invalid checkauth on resume");
            this.$router.replace({name: 'loginform'});
        });
}

/**
 * initialize the app
 */
function initApp()
{
    app.$mount('#app');

    if (navigator && navigator.splashscreen) {
        setTimeout(() => {
            navigator.splashscreen.hide();
        }, 500);
    }
};

if (window.cordova) {
    document.addEventListener("deviceready", () => {
        if (window.device) {
            store.commit('setDeviceCode', window.device.platform);
            store.commit('setDeviceVendorCode', window.device.uuid);
        }

        document.addEventListener('backbutton', function (e) {
            helpers.onBackButton(mixinsMethods.getHomePath(), app);
        });

        initApp();

    }, false);
} else {
    window.onload = function () {
        initApp();
    };
}

helpers.nextInput();
helpers.ripple();
