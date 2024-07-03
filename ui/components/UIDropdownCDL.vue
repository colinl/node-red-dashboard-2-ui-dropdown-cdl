<!-- A dashboard 2 widget

-->
<template>
    <!-- Component must be wrapped in a block so props such as className and style can be passed in from parent -->
    <div className="ui-dropdown-cdl-wrapper" :class="class">
        <v-select
            :label="props.label"

            variant="outlined"
            v-model="value"
            hide-details
            :items="options"
            :bg-color="color"
            :disabled="disabled"
            >
        </v-select>
    </div>
</template>

<script>
//import { markRaw } from 'vue'
import { mapState } from 'vuex'

export default {
    name: 'UIDropdownCDL',
    inject: ['$socket'],
    props: {
        /* do not remove entries from this - Dashboard's Layout Manager's will pass this data to your component */
        id: { type: String, required: true },
        props: { type: Object, default: () => ({}) },
        state: { type: Object, default: () => ({ enabled: false, visible: false }) }
    },
    setup (props) {
        //console.info('_nodeName_ setup with:', props)
        //console.debug('Vue function loaded correctly', markRaw)
    },
    data () {
        return {
            value: "",
            disabled: false,
            fromManual: false, // indicates that the current state is from a manual click
            topic: null,
            ui_update: {},
            class: "",
        }
    },
    computed: {
        ...mapState('data', ['messages']),

        color: function() {
            let answer = ""
            if (this.fromManual) {
                answer = this.props.waitingcolor ?? ""
            }
            return answer
        },
        options: function() {
            // return the labels from ui_update.options if present, otherwise the original options from props.options
            const theOptions = this.ui_update.options ? this.ui_update.options : this.props.options
            return theOptions.map((option) => option.label)
        }
    },
    mounted () {
        this.$socket.on('widget-load:' + this.id, (msg) => {
            // load the latest message from the Node-RED datastore when this widget is loaded
            // storing it in our vuex store so that we have it saved as we navigate around
            //console.log(`On widget-load ${JSON.stringify(msg)}`)
            this.processMsg(msg)     // pick up message values
            /*
            havent worked out how to use this yet
            this.$store.commit('data/bind', {
                widgetId: this.id,
                msg
            })
            */
        })
        this.$socket.on('msg-input:' + this.id, (msg) => {
            //console.log(`On msg-input: ${JSON.stringify(msg)}`)
            // new message received
            this.processMsg(msg)

            // store the latest message in our client-side vuex store when we receive a new message
            /*
            this.$store.commit('data/bind', {
                widgetId: this.id,
                msg
            })
            */
        })

        //console.log(`mounted, props: ${JSON.stringify(this.props)}`)
        // pickup node properties to local data
        this.pickupProperties()
        // tell Node-RED that we're loading a new instance of this widget
        this.$socket.emit('widget-load', this.id)
    },
    unmounted () {
        /* Make sure, any events you subscribe to on SocketIO are unsubscribed to here */
        this.$socket?.off('widget-load:' + this.id)
        this.$socket?.off('msg-input:' + this.id)
    },
    methods: {
        pickupProperties: function() {
            // pickup node properties from this.props and merge with base properties
            const props = this.props
            this.topic = props.topic // pickup topic from properties
            // fill in option labels if not provided
            props.options.forEach((option) => option.label = option.label.length>0 ? option.label : option.value)
        },
        processMsg: function(msg) {
            // if msg.payload is present then it has already been validated in the server
            if (msg.payload) {
                // clear flag indicating that current state is from a manual click
                this.fromManual = false
                // string in msg.payload matches a value in this.proc.options, find equivalent label
                const theOptions = this.ui_update.options ? this.ui_update.options : this.props.options
                const label = theOptions.find((option) => option.value === msg.payload)?.label
                if (label !== this.value) {
                    this.value = label
                    // set flag to indicate that we have changed it via a message
                    this.valueFromMsg = true
                }
                // pickup topic from msg if not configured
                if (!this.props.topic || this.props.topic.length === 0) {
                    this.topic = msg.topic
                }
            }
            // check whether msg.ui_update is present and is an object
            if (typeof msg.ui_update === 'object' && !Array.isArray(msg.ui_update) && msg.ui_update !== null) {
                //merge in data from this message
                this.ui_update = {...this.ui_update, ...msg.ui_update}
                //console.log(`ui_update: ${JSON.stringify(this.ui_update)}`)
            }
            // check whether msg.enabled is present
            if ("enabled" in msg) {
                this.disabled = !msg.enabled
            }
        },
    },
    watch: {
        value: function () {
            //console.log(`In watch value ${JSON.stringify(this.value)}, valueFromMsg: ${this.valueFromMsg}`)
            // this.valueFromMsg indicates whether the value change was from a message, in which case we
            // don't need to send a message
            if (this.valueFromMsg) {
                this.valueFromMsg = false
            } else {
                //console.log(`manual op`)
                // Not set, so must be a manual operation, not from a message.
                // set flag to say the current state if from a manual operation
                this.fromManual = true
                let msg1 = {}
                // return the value from ui_update.options if present, otherwise from the original options from props.options
                const theOptions = this.ui_update.options ? this.ui_update.options : this.props.options
                msg1.payload = theOptions.find((option) => option.label === this.value)?.value
                msg1.topic = this.topic
                this.$socket.emit('widget-action', this.id, msg1) // send the message without saving in data store
            }
        }
    },
}
</script>

<style scoped>
    /* CSS is auto scoped, but using named classes is still recommended */
    @import "../stylesheets/ui-dropdown-cdl.css";
</style>
