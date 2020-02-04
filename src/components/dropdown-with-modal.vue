<template>
    <div class="dropdown-with-modal">
        <div class="fake-select-field" @click="showModal">
            <div class="fieldvalue"><span v-if="!displayValue" :placeholder="placeholder"></span>
                <span>{{ displayValue }}</span>
            </div>
            <i class="dropdown-icon fa fa-chevron-down"></i>
        </div>

        <modal @close="closeModal(false)" v-show="modalVisible">
            <div slot="header" class="header-content">{{ fieldname }}</div>
            <div slot="body" class="body-content">
                <ul class="selection-list">
                    <li class="selection-list-item" v-for="(opt,idx) in options" v-if="opt.show">
                        <input class="selection-list-item-input custom-radio" type="radio" :id="fieldname+'_'+idx"
                               :value="opt.id"
                               v-model="picked" :key="opt.show">
                        <label class="selection-list-item-label" :for="fieldname+'_'+idx">{{opt.value}}</label>
                    </li>
                </ul>
            </div>
            <div slot="footer" class="footer-content">
                <div class="footer-button" @click="closeModal(false)">{{getTranslation('Cancel')}}</div>
                <div class="footer-button" @click="saveSelection">{{getTranslation('Ok')}}</div>
            </div>
        </modal>
    </div>
</template>
<script>
    import modal from './modal.vue';

    export default {
        name: 'dropdown-with-modal',
        props: {
            fieldname: {
                type: String,
                required: false,
                default: '',
            },
            options: {
                type: Array,
                required: true,
                default: [],
            },
            selected: {
                type: [String, Number],
                required: false,
                default: '',
            },
            placeholder: {
                type: String,
                required: false,
                default: 'select...',
            },
        },
        data() {
            return {
                picked: '',//the value picked in modal (id prop of selected option)
                modalVisible: false,
            };
        },
        computed: {
            displayValue() {
                if (this.options && this.options.length) {
                    let optionObj = this.getSelectedOption(this.selected);
                    if (optionObj) {
                        return optionObj.value;//use value prop as display value,id is being used as save value
                    }
                }
                return '';
            },

        },
        watch: {
            selected(newValue) {
                this.picked = newValue;
            },
            picked() {
                this.saveSelection();
            }
        },
        methods: {
            getSelectedOption(id) {
                //based on the id of the option, we try to find the option object
                return this.options.find((o) => {
                    return o.id == id;
                });
            },
            saveSelection() {
                //a change has been made/or not and the use pressed "ok" button in modal. save the picked option.id
                this.closeModal(true);
                this.$emit('change', { selection: this.picked });
            },
            showModal() {
                this.modalVisible = true;
                this.picked = this.selected;
            },
            closeModal(changed) {

                if (!changed) {
                    this.picked = this.selected;
                }

                this.modalVisible = false;
            },

        },
        components: {
            modal,
        },
    }
</script>