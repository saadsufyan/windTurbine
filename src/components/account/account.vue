<template>
    <div class="account box-container anim-container">
        <div class="scroll-container">
            <div class="content-container">
                <div class="form-group disabled">
                    <label class="helper-label">
                        <p class="list-name">{{ getTranslation("UserName") }}</p>
                    </label>
                    <input type="text" disabled v-model="username"/>
                </div>
                <div class="form-group"
                     v-bind:class="{ 'has-error': usernameError }">
                    <label class="helper-label">
                        <p class="list-name">{{ getTranslation("DisplayName") }}</p>
                    </label>
                    <input type="text" v-model="displayname" @change="displaynameInput" required="required"/>
                    <i class="bar"></i>
                </div>
                <div class="form-group"
                     v-bind:class="{ 'has-error': emailError }">
                    <label class="helper-label">
                        <p class="list-name">{{ getTranslation("Email") }}</p>
                    </label>
                    <input type="email" v-model="email" @change="emailInput" required="required"/>
                    <i class="bar"></i>
                </div>
                <div class="form-group"
                     v-bind:class="{ 'has-error': passwordError }">
                    <label class="helper-label">
                        <p class="list-name">{{ getTranslation("Password") }}</p>
                    </label>
                    <input type="password" v-model="password" @change="passwordInput" required="required"/>
                    <i class="bar"></i>
                    <label class="error-label" v-if="passwordError">{{ passwordErrorLabel }}</label>
                </div>
                <button class="button regular center" @click="saveUserData">{{ getTranslation("Save") }}</button>
                <router-link tag="button" class="button regular center logout" :to="{name: 'logout'}">
                    {{ getTranslation("Logout") }}
                </router-link>
            </div>
        </div>

    </div>
</template>
<script>
    export default {
        name: "Account",
        data()
        {
            return {
                displayname: '',
                username: '',
                email: '',
                password: '',
                emailError: false,
                usernameError: false,
                passwordError: false,
                passwordErrorLabel: '',
            };
        },
        mounted()
        {
            this.$store.commit('navbar/changeWindowTitle', this.getTranslation("Account"));
            let userData = JSON.parse(localStorage.user);
            this.username = (this.$store.state.username) ? this.$store.state.username : localStorage.username;
            this.displayname = this.$store.getters['user/getDisplayName'];
            this.email = (this.$store.state.user.email) ? this.$store.state.user.email : userData.Email;
            this.password = (this.$store.state.user.password) ? this.$store.state.user.password : localStorage.password;
        },
        methods: {
            displaynameInput()
            {
                this.$store.commit('user/setDisplayName', this.displayname);
            },
            passwordInput()
            {
//                this.$store.commit('api/setPassword', this.password);
            },
            emailInput()
            {
                let userData = JSON.parse(localStorage.user);
                if (userData.Email) {
                    userData.Email = this.email;
                    localStorage.user = JSON.stringify(localStorage.user);
                }
            },
            async saveUserData()
            {
                let self = this;
                this.totalCalls = 3;
                this.callsCompleted = 0;
                //reset all status
                this.passwordError = false;
                this.usernameError = false;

                this.$store.commit('navbar/showLoading', true);

                window.axios.defaults.headers.DisplayName = this.displayname;
                window.axios.defaults.headers.Email = this.email;
                await window.axios.put('/Session/CurrentUser/Update', {})
                    .then((response) => {

                        let data = response.data;

                        if (data.CurrentUserUpdateResult && data.CurrentUserUpdateResult[0] && data.CurrentUserUpdateResult[0].UpdateResult && data.CurrentUserUpdateResult[0].UpdateResult.toLowerCase() == 'ok') {
                            this.$store.commit('user/setData', JSON.stringify(data.Session[0]));
                            this.$store.commit('user/setNotificationData', JSON.stringify(data.NotificationPreferences));

                        } else {
                            console.error(data.CurrentUserUpdateResult[0].UpdateResult);
                        }

                        self.callsCompleted++;
                        self.finishedSaving();
                    })
                    .catch((error) => {
                        this.callsCompleted++;
                        this.alert(error);
                    });

                window.axios.defaults.headers.currentpassword = localStorage.getItem('password');
                window.axios.defaults.headers.newpassword = this.password;

                await window.axios.put('/Session/CurrentUser/PasswordUpdate')
                    .then((response) => {
                        this.callsCompleted++;
                        let data = response.data;
                        if (data.CurrentUserPasswordUpdateResult && data.CurrentUserPasswordUpdateResult.length && (data.CurrentUserPasswordUpdateResult[0].result && data.CurrentUserPasswordUpdateResult[0].result.toLowerCase() == 'ok') || (data.CurrentUserPasswordUpdateResult[0].Result && data.CurrentUserPasswordUpdateResult[0].Result.toLowerCase() == 'ok')) {
                            this.$store.commit('api/setPassword', this.password);
                            this.callsCompleted++;

                            //relogin with set password
                            global.auth.login()
                                .then((data) => {
                                    this.callsCompleted++;
                                    this.finishedSaving();
                                })
                                .catch((err) => {
                                    this.callsCompleted++;
                                    console.error('error relogin after user update: ', err);
                                    this.passwordError = true;
                                    this.passwordErrorLabel = this.getTranslation('PasswordError');
                                    this.finishedSaving();
                                });

                        } else {
                            this.totalCalls = 2;
                            this.passwordError = true;
                            this.passwordErrorLabel = this.getTranslation("Invalid Password");
                            this.finishedSaving();
                        }
                    })
                    .catch((error) => {
                        this.callsCompleted++;
                        console.error('password update error: ', error);
                        this.alert(error);
                    });

                this.$emit('save');
            },
            finishedSaving()
            {
                if (this.callsCompleted >= this.totalCalls) {

                    this.$store.commit('navbar/showLoading', false);

                    if (!this.passwordError && !this.usernameError) {
                        this.alert(this.getTranslation("Saved changes"));
                    }

                }
            },
        },
    };
</script>