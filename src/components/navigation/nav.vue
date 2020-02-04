<template>
    <nav class="nav-header" v-bind:class="{'visible': showNavBar}" v-show="showNavBar">
        <div class="navbar">
            <div class="navbar-inner">
                <div class="left" @click="navigate">
                    <div class="hamburger-container" ref="hamburgerMenu"></div>
                    <!--<div class="menu-icon"-->
                    <!--:class="{'new-message': hasUnreadNotifications && isHome, 'back-button': !showBurger}">-->
                    <!--<span></span>-->
                    <!--</div>-->
                </div>
                <div class="center">
                    <transition name="fade">
                        <div id="navTitle">
                            {{ windowTitle }}
                        </div>
                    </transition>
                </div>
                <div class="right">
                    <router-link tag="div" class="error-container" :class="errorIndicator" :to="{name: 'warning'}">
                        <i class="error-icon"/>
                    </router-link>
                    <router-link tag="div" class="search-button" :to="{name: 'search'}">
                        <i class="search-icon"/>
                    </router-link>
                </div>
                <div class="search-container" :class="{'visible': showSearch}">
                    <input type="text" class="search-input" autofocus @input="changeSearch" v-model="query" :class="{'visible': showSearch}"/>
                </div>
            </div>
        </div>
        <sidemenu id="sidemenu-main"/>
    </nav>
</template>

<script>
    import store from '@/store';
    import sidemenu from 'component/sidemenu/sidemenu.vue';

    // BodyMovin after effects hamburger animation
    import bodymovin from 'bodymovin';
    import * as animationData from '@/assets/hamburger.json';

    export default {
        data: function () {
            return {
                error: false,
                showErrorToggle: false,
                hasUnreadNotifications: false,
                drawer: null,
                animationPlaying: false,
            };
        },
        computed: {
            errorIndicator()
            {
                let turbines = this.$store.getters['windmills/getWarningTurbines'];
                if (turbines.length == 0) {
                    return 'hidden';
                }

                let indicator = helpers.getStatusIndicator(turbines);
                return indicator;
            },
            query: {
                get()
                {
                    return this.$store.getters['navbar/getSearchQuery'];
                },
                set(newValue)
                {
                },
            },
            windowTitle()
            {
                return this.$store.state.navbar.windowTitle;
            },
            showNavBar()
            {
                return this.$store.state.navbar.showNavBar;
            },
            isHome()
            {
                return this.$route.name == this.getHomePath();
            },
            showSearch()
            {
                return this.$route.name == 'search';
            },
            showBurger()
            {
                return this.$route.name == this.getHomePath();
            },
            showSideMenu()
            {
                return this.$store.getters['navbar/getShowSideMenu'];
            },
        },
        mounted()
        {
            this.anim = bodymovin.loadAnimation({
                    container: this.$refs.hamburgerMenu,
                    renderer: 'svg',
                    loop: false,
                    autoplay: false,
                    animationData: animationData,
//                    rendererSettings: this.options.rendererSettings
                }
            );
            this.handleBurger();

            let menu = TouchMenuLA({
                target: document.getElementById('sidemenu-main'),
                onOpen: () => {
                    this.$store.commit('navbar/showSideMenu', true);
                },
                onClose: () => {
                    this.$store.commit('navbar/showSideMenu', false);
                },

            });

            this.drawer = menu;

            this.getNotifications()
                .then(res => {
                    if (res === true) {
                        this.hasUnreadNotifications = true;
                    } else {
                        this.hasUnreadNotifications = false;
                    }
                }).catch((err) => {
                console.error(err);
            });
        },
        methods: {
            changeSearch(event) {
                this.$store.commit('navbar/setSearchQuery', event.target.value);
            },
            handleBurger()
            {
                if (this.animationPlaying == false) {
                    this.animationPlaying = true;
                    this.anim.addEventListener('complete', (e) => {
                        this.animationPlaying = false;
                    });
                    if (this.isHome == true) {
                        this.anim.playSegments([22, 36], true);
                    } else {
                        this.anim.playSegments([6, 21], true);
                    }
                }
            },
            navigate()
            {
                if (!this.showBurger) {
                    this.$router.go(-1);
                } else {
                    this.$store.commit('navbar/showSideMenu', true);
                }
            },
        },
        components: {
            sidemenu,
        },
        watch: {
            isHome(newVal, oldVal)
            {
                this.handleBurger();
            },
            showSideMenu(val)
            {
                let sideMenu = document.querySelector('.tmla-mask');
                if (!sideMenu) {
                    let menu = TouchMenuLA({
                        target: document.getElementById('sidemenu-main'),
                        onOpen: (e) => {

                            this.$store.commit('navbar/showSideMenu', true);
                        },
                        onClose: (e) => {

                            this.$store.commit('navbar/showSideMenu', false);
                        },
                    });

                    this.drawer = menu;
                }
                if (val === true) {
                    if (sideMenu) {
                        sideMenu.style.pointerEvents = 'auto';
                    }
                    if (this.drawer) {
                        this.drawer.open();

                    }
                } else {
                    if (sideMenu) {
                        sideMenu.style.pointerEvents = 'none';
                    }
                    if (this.drawer) {
                        this.drawer.close();

                    }
                }
            },
        },
    };

</script>
