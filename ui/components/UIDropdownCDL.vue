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
//import { mapState } from 'vuex'

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
    mounted () {
        this.$socket.on('widget-load:' + this.id, (msg) => {
            if (logEvents) console.log(`On widget-load id: ${this.id}`, msg)
            // msg will be null if no message has been sent to the node yet
            if (msg) this.processMsg(msg)     // pick up message values
        })
        this.$socket.on('msg-input:' + this.id, (msg) => {
            if (logEvents) console.log(`On msg-input id: ${this.id}`, msg)
            // new message received
            this.processMsg(msg)
        })
        this.$socket.on('widget-updates:' + this.id, (msg) => {
            if (logEvents) console.log(`On widget-updates id: ${this.id}`,msg)
            // updates received
            this.processUpdates(msg._updates)
        })

        if (logEvents) console.log(`mounted id: ${this.id}\nprops: ${JSON.stringify(this.props)}\nstate: ${JSON.stringify(this.state)}`)
        // pickup node properties to local data
        this.pickupProperties()
        // tell Node-RED that we're loading a new instance of this widget
        this.$socket.emit('widget-load', this.id)
    },
    unmounted () {
        /* Make sure, any events you subscribe to on SocketIO are unsubscribed to here */
        this.$socket?.off('widget-load:' + this.id)
        this.$socket?.off('msg-input:' + this.id)
        this.$socket?.off('widget-updates:' + this.id)
    },
    computed: {
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
    methods: {
        pickupProperties: function() {
            // pickup node properties from this.props and merge with base properties
            const props = this.props
            this.topic = props.topic // pickup topic from properties
            // fill in option labels if not provided
            props.options.forEach((option) => option.label = option.label.length>0 ? option.label : option.value)
        },
        processMsg: function(msg) {
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
        /** given an object containing properties to be updated
         * updates this.props with the new values
         * any validation required should have been done in the server
         */
        processUpdates: function(updates) {
            for (const [key, value] of Object.entries(updates)) {
                this.props[key] = value
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
                // if required send a message to a custom event in the server to update the state store, for example
                /*
                const data = {id: this.id, timestamp: new Date().toISOString()}
                console.log(`sending message to server from ${this.id} containing`, data)
                this.$socket.emit('update-statestore', this.id, data)
                */

                // send the message to connected nodes without saving in data store
                this.$socket.emit('widget-action', this.id, msg1)
            }
        }
    },
}
</script>

<style scoped>
    /* CSS is auto scoped, but using named classes is still recommended */
    @import "../stylesheets/ui-dropdown-cdl.css";
</style>
