<template>
    <div class="side-menu touch-menu-la">
        <aside class="side-menu-drawer mdc-temporary-drawer">
            <nav class="mdc-temporary-drawer__drawer">
                <header class="header">
                    <div class="header-content">
                        <div class="logo">
                            <img src="@/assets/images/logo.svg" alt="">
                        </div>
                        <div class="user-information">
                            <span>{{ userDisplayName }}</span>
                        </div>
                        <div class="organisation-information">
                            <p>
                                {{ parkCount }}
                                <span>{{ getTranslation('Parks') }}</span>
                            </p>
                            <p>
                                {{ turbineCount }}
                                <span>{{ getTranslation('Turbines') }}</span>
                            </p>
                        </div>
                    </div>
                </header>
                <ul class="menu-list">
                    <router-link :to="{name: 'overview'}" exact tag="li" @click.native="closeSideMenu">
                        <i class="home-icon icon"/>
                        <span>{{ getTranslation("Home") }}</span>
                    </router-link>
                    <router-link :to="{name: 'inbox'}" exact tag="li" @click.native="closeSideMenu">
                        <i class="inbox-icon icon"/>
                        <span class="inbox-unread" v-if="hasUnreadNotifications"></span>
                        <span>{{ getTranslation("Inbox") }}</span>
                    </router-link>
                    <router-link :to="{name: 'account'}" exact tag="li" @click.native="closeSideMenu">
                        <i class="account-icon icon"/>
                        <span>{{ getTranslation("My account") }}</span>
                    </router-link>
                    <router-link :to="{name: 'settings'}" exact tag="li" @click.native="closeSideMenu">
                        <i class="settings-icon icon"/>
                        <span>{{ getTranslation("Settings") }}</span>
                    </router-link>
                    <router-link :to="{name: 'contact'}" exact tag="li" @click.native="closeSideMenu">
                        <i class="contact-icon icon"/>
                        <span>{{ getTranslation("Contact") }}</span>
                    </router-link>
                    <router-link :to="{name: 'terms'}" exact tag="li" @click.native="closeSideMenu">
                        <i class="terms-icon icon"/>
                        <span>{{ getTranslation("Terms") }}</span>
                    </router-link>
                </ul>
            </nav>
        </aside>
    </div>
</template>

<script>
    export default {
        name:'side-menu',
        data(){
            return {
                drawer: null,
                transformX: 0,
                hasUnreadNotifications: false,
            }
        },
        mounted() {
            this.getNotifications()
                .then(res => {
                    if (res === true) {
                        this.hasUnreadNotifications = true;
                    }
                })
                .catch((err)=>{
                    console.error(err);
                });
        },
        computed: {
            user() {
                return this.$store.getters['user/getusername'];
            },
            userDisplayName() {
                return this.$store.getters['user/getDisplayName'];
            },
            turbineCount() {
                return (this.$store.getters['windmills/getTurbines'].length) ? this.$store.getters['windmills/getTurbines'].length : '- -';
            },
            parkCount() {
                if (this.$store.getters['windmills/getParks'].parks) {
                    return (this.$store.getters['windmills/getParks'].parks.length) ? this.$store.getters['windmills/getParks'].parks.length : '- -';
                }
                return '- -';
            },
        },
        methods: {
            closeSideMenu() {
                this.$store.commit('navbar/showSideMenu', false);
            }
        },
    }
</script>
