<template>
    <div class="login-reset">
        <form>
            <div class="form-group" 
                    v-bind:class="{ 'has-error': usernameError }">
                <input type="text" v-model="username" required="required"/>
                <label class="control-label" for="input">{{ getTranslation("Email") }}</label><i class="bar"></i>
            </div>
            <div class="button-container">
                <button class="button progress-button" type="button" v-on:click="resetPassword" data-style="fill" data-horizontal="">
                    <span class="content">{{ getTranslation("Send") }}</span>
                    <span class="loader" v-bind:class="{ 'loading': isLoading, 'success': !isLoading && !usernameError && !passwordError && !bootState }">
                        <loader/>
                    </span>
                </button>
            </div>
        </form>
        <router-link :to="{name: 'loginform'}" class="form-link">
            {{ getTranslation("Login") }}
        </router-link>
    </div>
</template>

<script>
    import hexagon from '../hexagon/hexagon.vue';
    import loader from '../loader.vue';
    export default {
        mounted(){
            this.checkLanguage();
        },
        data: function(){
            return {
                bootState: true,
                title: 'Reset password',
                show: true,
                usernameError: false,
                isLoading: false,
                username: '',
                passwordError: '',
            }
        },
        components: {
            hexagon: hexagon,
            loader: loader,
        },
        methods: {
            resetPassword(){

                let self = this;
                // Initial loading/error states
                this.isLoading = true;
                this.usernameError = false;
                this.passwordError = false;
                this.bootState = false;
                
                // Communicate to api;
                window.axios.defaults.headers.email = this.username;
                window.axios.put('User/RequestPasswordReset')
                    .then( (response) => {
                        self.isLoading = false;
                        let status = response.data.RequestPasswordReset[0].Result;
                        if (status) {
                            self.usernameError = true;
                        } else {
                            setTimeout(function() {
                                self.$router.replace({ name: 'loginform' });
                            }, 1000);
                        }
                    })
                    .catch( (error) => {
                        self.isLoading = false;
                        self.usernameError = true;
                        console.error('Reset password failed: ', error);
                    });
            },
            validateFields(){
                let emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
                let emailTest = emailRegex.test(this.username);
                if (this.username == undefined || this.username.length == 0) {
                    this.usernameError = true;
                } else {
                    this.usernameError = false;
                }
                return this.usernameError;
            }
        }
    }
</script>
