<template>
    <div class="login-form">
        <form id="loginform">
            <div class="form-group"
                    v-bind:class="{ 'has-error': usernameError }">
                <input type="text" v-model="username" @change="usernameInput" required="required" data-index="1" id="username"/>
                <label class="control-label" for="username" >{{ getTranslation("Username") }}</label><i class="bar"></i>
            </div>
            <div class="form-group"
                    v-bind:class="{ 'has-error': passwordError }">
                <input type="password" v-model="password" @change="passwordInput" required="required" data-index="2" id="password"/>
                <label class="control-label" for="password" v-bind:class="{'has-error': passwordError }">{{ getTranslation("Password") }}</label><i class="bar"></i>
            </div>
            <div class="button-container">
                <button class="button regular progress-button" type="button" v-on:click="loginUser" data-style="fill" data-horizontal="">
                    <span class="content">{{ getTranslation("Login") }}</span>
                    <span class="loader" v-bind:class="{ 'loading': isLoading, 'success': !isLoading && !usernameError && !passwordError && !bootState }">
                        <loader/>
                    </span>
                </button>
            </div>
        </form>
        <router-link :to="{name: 'resetpassword'}" class="form-link">
            {{ getTranslation("Forgotpassword") }}
        </router-link>
    </div>
</template>
<script>
    import hexagon from '../hexagon/hexagon.vue';
    import loader from '../loader.vue';
    export default {
        name:'loginform',
        mounted(){
            auth.resetData();//always clear store.

            let self = this;
            // Component is loaded; do stuff!

            // Change navbar title for this page
            this.$store.commit('navbar/showNavBar', false);

            this.$store.commit('windmills/setEmpty');
            this.$store.commit('user/setEmpty');

            this.setLanguage();
            this.$store.commit('windmills/setEmpty');

            $('#loginform').on('keydown', 'input', function (event) {
                if (event.which == 13) {
                    event.preventDefault();
                    let $this = $(event.target);
                    let index = parseFloat($this.attr('data-index'));
                    let el = $('[data-index="' + (index + 1).toString() + '"]');
                    el.focus();
                    if (el.length == 0) {
                        self.loginUser();
                    }
                }
            });
            let $htmlOrBody = $('.login'), // scrollTop works on <body> for some browsers, <html> for others
                scrollTopPadding = 8;
            $('textarea, input').focus(function() {
                // get textarea's offset top position
                let textareaTop = $(this).offset().top;
                // scroll to the textarea
                $htmlOrBody.animate({ scrollTop: textareaTop - scrollTopPadding});
            });
        },
        data: function(){
            return {
                bootState: true,
                title: 'Login',
                show: true,
                username: '',
                password: '',
                usernameError: false,
                passwordError: false,
                isLoading: false,
            }
        },
        components: {
            hexagon: hexagon,
            loader: loader,
        },
        methods: {
            usernameInput() {
                this.$store.commit('api/setLogin', this.username);
                this.$store.commit('user/setUsername', this.username);
            },
            passwordInput() {
                this.$store.commit('api/setPassword', this.password);
            },
            loginUser(){
                this.usernameError = false;
                this.passwordError = false;

                let self = this;

                if (this.username.length < 1 || this.password.length < 1) {
                    this.usernameError = true;
                    this.passwordError = true;
                    return false;
                }

                // Commit inputs to store (necessary for when initially setting the values without "changing" the input state)
                this.usernameInput();
                this.passwordInput();

                // Initial loading/error states
                this.isLoading = true;
                this.bootState = false;

                // Communicate to api;
                auth.login()
                    .then( (data) => {
                        // Success
                        self.$store.commit('languages/setLocalData', {
                            data: data.Session[0].LanguageCode
                        });
                        self.$store.commit('user/setDisplayName', data.Session[0].DisplayName);
                        self.$store.commit('user/setData', JSON.stringify(data.Session[0]));
                        self.$store.commit('user/setNotificationData', JSON.stringify(data.NotificationPreferences));

                        let userState = data;
                        let sessionState = data.Session[0];
                        let homeLink;
                        let homePath;

                        if (sessionState && sessionState.ParkCount && sessionState.ParkCount == 1) {
                            homeLink = '/overview/'+ sessionState.FirstParkGroupID;
                            homePath = 'parkoverview';

                            if (sessionState.TurbineCount == 1) {
                                homeLink = '/turbine/' + sessionState.FirstTurbineID;
                                homePath = 'turbinedetails';
                            }
                        } else {
                            homeLink = '/overview';
                            homePath = 'overview';
                        }

                        self.$store.commit('user/setHomeLink', homeLink);
                        self.$store.commit('user/setHomePath', homePath);

                        windmillClass.initialiseData()
                            .then( () => {
                                self.isLoading = false;
                                // Set store "base" url? User home screen determined by ParkCount
                                self.$router.replace({ path : homeLink });
                            })
                            .catch(err => {
                                console.error("INITIALISING DATA ERROR", err);
                            });
                    })
                    .catch( (error) => {
                        console.error(error);
                        // Failure
                        setTimeout(function(){
                            self.usernameError = true;
                            self.passwordError = true;
                            self.isLoading = false;
                        }, 1000);
                    });
            },
            validateFields(){
                let emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
                if (this.username == undefined || this.username.length == 0) {
                    this.usernameError = true;
                } else {
                    this.usernameError = false;
                }
                if (this.password == undefined || this.password.length == 0) {
                    this.passwordError = true;
                } else {
                    this.passwordError = false;
                }
                return !(this.passwordError || this.usernameError);
            }
        },

    }
</script>
