<!-- A dashboard 2 widget

-->
<template>
    <!-- Component must be wrapped in a block so props such as className and style can be passed in from parent -->
    <div className="ui-dropdown-cdl-wrapper" :class="props.class" >
        <v-select
            :label="props.label"

            variant="outlined"
            v-model="value"
            hide-details
            :items="options"
            :bg-color="color"
            :disabled="!props.enabled"
            >
        </v-select>
    </div>
</template>

<script>
//import { markRaw } from 'vue'
import { mapState } from 'vuex'

const logEvents = false  // whether to log incoming messages and events

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
        //console.info('UIDropdownCDL setup with:', props)
        //console.debug('Vue function loaded correctly', markRaw)
    },
    data () {
        return {
            value: "",
            fromManual: false, // indicates that the current state is from a manual click
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
            // return the labels from props.options
            return this.props.options.map((option) => option.label)
        }
    },
    mounted () {
        this.$socket.on('widget-load:' + this.id, (msg) => {
            // load the latest message from the Node-RED datastore when this widget is loaded
            // storing it in our vuex store so that we have it saved as we navigate around
            if (logEvents) console.log(`On widget-load ${JSON.stringify(msg)}`)
            this.processMsg(msg)     // pick up message values
        })
        this.$socket.on('msg-input:' + this.id, (msg) => {
            if (logEvents) console.log(`On msg-input: ${JSON.stringify(msg)}`)
            // new message received
            this.processMsg(msg)
        })

        if (logEvents) console.log(`mounted, props: ${JSON.stringify(this.props)}`)
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
            // pickup config data first as it may affect the meaning of msg.payload
            // check whether msg.ui_update is present and is an object
            if (typeof msg.ui_update === 'object' && !Array.isArray(msg.ui_update) && msg.ui_update !== null) {
                // array of properties to allow ui_update for. Need to include class so it updates dynamically
                const propertiesToUpdate = ["options","class"]
                for (const [key, value] of Object.entries(msg.ui_update)) {
                    if (propertiesToUpdate.includes(key)) {
                        this.props[key] = value
                    }
                }
            }
            // check whether msg.class is present
            if ("class" in msg) {
                // update our local copy of props
                this.props.class = msg.class
            }
            // check whether msg.enabled is present
            if ("enabled" in msg) {
                // update our local copy of props
                this.props.enabled = msg.enabled
            }
            // check whether msg.topic is present
            if ("topic" in msg) {
                // yes, save in topicUpdated in props
                this.props.topicUpdated = msg.topic
            }
            // check whether msg.payload is present and is one of the options
            if (typeof msg.payload === "string" && this.props.options.find((option) => option.value === msg.payload)) {
                // clear flag indicating that current state is from a manual click
                this.fromManual = false
                // string in msg.payload matches a value in this.proc.options, find equivalent label
                const label = this.props.options.find((option) => option.value === msg.payload)?.label
                if (label !== this.value) {
                    this.value = label
                    // set flag to indicate that we have changed it via a message
                    this.valueFromMsg = true
                }
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
                // return the value for the matching label
                msg1.payload = this.props.options.find((option) => option.label === this.value)?.value
                // set topic to configured one if not empty, otherwise the topic from last valid message
                if (this.props.topic && this.props.topic.length > 0) {
                    msg1.topic = this.topic
                } else {
                    msg1.topic = this.props.topicUpdated
                }
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
