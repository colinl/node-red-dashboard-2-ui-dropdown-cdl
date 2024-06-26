<!-- A dashboard 2 widget

-->
<template>
    <!-- Component must be wrapped in a block so props such as className and style can be passed in from parent -->
    <div className="ui-dropdown-cdl-wrapper" :class="class">
        <div>ID: {{ id }}</div>
    <div>Name: {{ props.name }}</div>
    <div>Group: {{ props.group }}</div>
    <div>label: {{ props.label }}</div>
        <v-select
            :label="props.label"

            variant="outlined"
            v-model="value"
            hide-details
            :options="options"
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
        console.info('_nodeName_ setup with:', props)
        //console.debug('Vue function loaded correctly', markRaw)
    },
    data () {
        return {
            properties: {},
            label: "Select",
            value: "",
            options: [],
            color: "",
            disabled: false,
            class: "",
        }
    },
    computed: {
        ...mapState('data', ['messages']),
    },
    mounted () {
        this.$socket.on('widget-load:' + this.id, (msg) => {
            // load the latest message from the Node-RED datastore when this widget is loaded
            // storing it in our vuex store so that we have it saved as we navigate around
            console.log(`On widget-load ${JSON.stringify(msg)}`)
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
            console.log(`Message received: ${JSON.stringify(msg)}`)
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

        console.log(`mounted, props: ${JSON.stringify(this.props)}`)
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
            //const props = this.props
            //this.properties = JSON.parse(JSON.stringify(this.props))
            console.log(`props: ${JSON.stringify(this.props)}`)
            //this.label = `test ${props.label}`
            //console.log(`this.label: ${this.label}`)
            // ...
        },
        processMsg: function(msg) {
            // ...
        },
    },
}
</script>

<style scoped>
    /* CSS is auto scoped, but using named classes is still recommended */
    @import "../stylesheets/ui-dropdown-cdl.css";
</style>
