import Vue from 'vue';
import vueRouter from 'vue-router';

Vue.use(vueRouter);

function load(component)
{
    return () => import(`component/${component}.vue`);
}

import store from '../store';
import auth from '../components/login/auth.js';

// DEFINE CUSTOM ROUTES
const routes = [
    {
        name: 'home',
        path: '/',
        component: load('overview/overview'),
        meta: {
            auth: true,
        },
    },
    {
        path: '/login',
        component: load('login/login'),
        children: [
            {
                name: 'loginform',
                path: '',
                component: load('login/loginform'),
            }, {
                name: 'resetpassword',
                path: 'resetpassword',
                component: load('login/resetpassword'),
            }
        ]
    },
    {
        name: 'logout',
        path: '/logout',
        component: load('login/login'),
    }, {
        name: 'search',
        path: '/search',
        component: load('search/search'),
        props: true,
        meta: {
            keepAlive: true,
            auth: true,
        }
    }, {
        name: 'overview',
        path: '/overview',
        component: load('overview/overview'),
        meta: {
            keepAlive: true,
            auth: true,
        },
    }, {
        name: 'overviewmap',
        path: '/overviewmap',
        component: load('overview/map'),
        meta: {
            keepAlive: true,
            auth: true,
        },
    },
    {
        path: '/overview/:id',
        component: load('park/park'),
        children: [
            {
                name: 'parkoverview',
                path: '',
                component: load('park/overview'),
                meta: {
                    keepAlive: false,
                    auth: true,
                },
            },
            {
                name: 'parkstatistics',
                path: 'statistics',
                component: load('park/statistics'),
                meta: {
                    keepAlive: false,
                    auth: true,
                },
            },
            {
                name: 'parkweather',
                path: 'weather',
                component: load('park/weather'),
                meta: {
                    keepAlive: false,
                    auth: true,
                },
            },
            {
                name: 'parkmap',
                path: 'map',
                component: load('park/map'),
                meta: {
                    keepAlive: false,
                    auth: true,
                },
            },
        ],
        meta: {
            keepAlive: false,
            auth: true,
        },
    }, {
        path: '/turbine/:id',
        name: 'turbine',
        component: load('turbine/turbine'),
        children: [
            {
                name: 'turbinedetails',
                path: '',
                component: load('turbine/details'),
                meta: {
                    keepAlive: false,
                    auth: true,
                },
            },
            {
                name: 'turbinestatistics',
                path: 'statistics',
                component: load('turbine/statistics'),
                meta: {
                    keepAlive: false,
                    auth: true,
                },
            },
            {
                name: 'turbineweather',
                path: 'weather',
                component: load('turbine/weather'),
                meta: {
                    keepAlive: false,
                    auth: true,
                },
            },
            {
                name: 'turbinesettings',
                path: 'turbinesettings',
                component: load('turbine/settings'),
                meta: {
                    keepAlive: false,
                    auth: true,
                },
            },
            {
                name: 'turbinemanagement',
                path: 'turbinemanagement',
                component: load('turbine/management'),
                meta: {
                    keepAlive: false,
                    auth: true,
                },
            },
        ],
        meta: {
            keepAlive: false,
            auth: true,
        },
    }, {
        name: 'inbox',
        path: '/inbox',
        component: load('sidemenu/inbox'),
        meta: {
            auth: true
        }
    }, {
        name: 'inbox-detail',
        path: '/inbox-detail/:messageId',
        component: load('sidemenu/inbox-detail'),
        props: true,
        meta: {
            auth: true
        }
    }, {
        name: 'settings',
        path: '/settings',
        component: load('settings/settings'),
        meta: {
            keepAlive: true,
            auth: true,
        }
    }, {
        name: 'setting-notifications',
        path: '/setting-notifications',
        component: load('settings/notifications'),
        meta: {
            keepAlive: true,
            auth: true,
        }
    }, {
        name: 'account',
        path: '/account',
        component: load('account/account'),
        meta: {
            keepAlive: true,
            auth: true,
        }
    }, {
        name: 'contact',
        path: '/contact',
        component: load('sidemenu/contact'),
        meta: {
            keepAlive: true,
            auth: true,
        }
    }, {
        name: 'terms',
        path: '/terms',
        component: load('sidemenu/terms'),
        meta: {
            keepAlive: true,
            auth: true,
        }
    }, {
        name: 'warning',
        path: '/warning',
        component: load('warning/warning'),
        meta: {
            keepAlive: true,
            auth: true,
        }
    }
];

let router = new vueRouter({
    routes,
    scrollBehavior(to, from, savedPosition)
    {
        return {x: 0, y: 0};
    },
});
global.router = router;

router.beforeEach(async (to, from, next) => {

    //check if we want to logout
    if (to.name == 'logout') {
        auth.resetData();//clear vuex store and localStorage otherwise we will be logged in on restart.
        //redirect to loginform
        next({name: 'loginform'});

        return false;
    }

    //if not logging out, we want to check if auth is required.
    if (to.meta.auth === true || to.path === '/') {
        let validToken = false;

        //check if token is valid, if not, try to relogin, if that fails we will redirect to loginform
        //loginform will resetData in mounted()
        //we need to check auth first before routing, otherwise it might be possible that other api calls will end in
        // unauthenticated calls
        try {
            validToken = await auth.checkAuth();
        }
        catch (e) {
            console.error('error refreshing token');
            //logout
            next({name: 'loginform'});
            return;
        }

        if (validToken) {
            if (to.name === 'home') {
                //redirect to overview
                next({name: 'overview'});
                return;
            }

            //go to the page we want to go to
            next();

        } else {
            //redirect to loginform, loginform will resetData in mounted()
            next({name: 'loginform'});
        }

    } else {
        //unauthorized routing, doesn't matter if token is (in)valid.
        next();
    }

});

/**
 * close keyboard after each navigation, wont do a thing if not shown.
 * otherwise it wont work on android (if done in beforeRoutLeave)
 */
router.afterEach((to, from) => {
    if (window.Keyboard && typeof window.Keyboard.hide === 'function') {
        window.Keyboard.hide();
    }
});

export default router;