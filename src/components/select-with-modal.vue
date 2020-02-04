<template>
    <div class="select-with-modal">
        <div class="fake-select-field" @click="showSelect">
            <div class="fieldname" v-if="fieldname && showlabel == 'true'">{{ fieldname }}</div>
            <div class="fieldvalue">
                <select class="select-menu-dropdown" v-model="picked" :name="fieldname" :id="fieldIdentifier">
                    <option :value="opt.id" v-for="(opt, idx) in options">{{ opt.value }}</option>
                </select>
            </div>
        </div>

        <modal @close="closeModal(false)" v-show="modalVisible">
            <div slot="header" class="header-content">{{ fieldname }}</div>
            <div slot="body" class="body-content">
                <!--<ul class="selection-list">-->
                    <!--<li class="selection-list-item" v-for="(opt,idx) in options">-->
                        <!--<input class="selection-list-item-input custom-radio" type="radio" :id="fieldname+'_'+idx"-->
                               <!--:value="opt.id"-->
                               <!--v-model="picked">-->
                        <!--<label class="selection-list-item-label" :for="fieldname+'_'+idx">{{opt.value}}</label>-->
                    <!--</li>-->
                <!--</ul>-->
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
        name: 'select-with-modal',
        props: ['options', 'fieldname', 'selected', 'showlabel'],
        data() {
            return {
                picked: '',  //the value picked in modal (id prop of selected option)
                modalVisible: false,
                select: null,
            };
        },
        mounted() {
            this.picked = this.selected;

            setTimeout(() => {
                this.select = customSelect( document.getElementById( this.fieldIdentifier ) , {
                    containerClass: 'select-' + this.fieldIdentifier
                });
            }, 275);
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
            fieldIdentifier() {
                return this.fieldname.replace(/ /g, '-').toLowerCase();
            },
        },
        watch: {
            selected(newValue) {
                this.picked = newValue;
            },
            options(newValue) {
                setTimeout(() => {
                    if (this.select !== null && this.select[0] && this.select[0].empty && typeof this.select[0].destroy == 'function') {
                        this.select[0].destroy();
                        this.select = null;
                    }
                    this.select = customSelect( document.getElementById( this.fieldIdentifier ) , {
                        containerClass: 'select-' + this.fieldIdentifier
                    });
                    this.$store.commit('navbar/showLoading', false);
                }, 500);
                if (this.OS_IOS()) {
                } else {
                    this.$store.commit('navbar/showLoading', false);
                }
            },
            picked(newVal, oldVal) {
                this.saveSelection();
            },
        },
        methods: {
            isSelected(optionId) {
                if (optionId == this.selected) {
                    this.picked = optionId;
                    return true;
                }
                return false;
            },
            showSelect() {
                this.select.open = true;
            },
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