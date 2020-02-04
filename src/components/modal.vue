<template>
    <transition name="modal">
        <div class="modal-mask">
            <div class="modal-bg" @click="dismissModal"></div>
            <div class="modal-wrapper">
                <div class="modal-container">
                    <div class="modal-header">
                        <slot name="header"></slot>
                    </div>
                    <div class="modal-body">
                        <slot name="body"></slot>
                    </div>
                    <div class="modal-footer">
                        <slot name="footer">
                            <div class="cancel-button" @click="dismissModal">ok</div>
                        </slot>
                    </div>
                </div>
            </div>
        </div>
    </transition>
</template>
<script>
    export default {
        name: 'modalComponent',
        methods: {
            dismissModal(e) {
                this.$emit('close');
            },
        },
    }
</script>