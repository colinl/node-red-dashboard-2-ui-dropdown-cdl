module.exports = function (RED) {
    function UIDropdownCDLNode (config) {
        RED.nodes.createNode(this, config)

        const node = this

        // which group are we rendering this widget
        const group = RED.nodes.getNode(config.group)

        const base = group.getBase()

        // initialise data store on startup or deploy
        base.stores.data.save(base, node, {})

        // server-side event handlers
        const evts = {
            onAction: true,
            onInput: function (msg, send, done) {
                // pick up existing stored data
                let storedData = base.stores.data.get(node.id)
                //console.log(`onInput storedData: ${JSON.stringify(storedData)}\n\n`)

                // does msg.ui_update exist and is an object?
                if (typeof msg.ui_update === 'object' && !Array.isArray(msg.ui_update) && msg.ui_update !== null) {
                    // yes it does
                    storedData.ui_update ??= {}    // initialise if necessary
                    // merge in data from this message
                    storedData.ui_update = {...storedData.ui_update, ...msg.ui_update}
                }

                // is msg.payload a valid selection?
                if ((typeof msg.payload === "string") && config.options.includes(msg.payload)) {
                    storedData.payload = msg.payload
                    // also store the topic in this case, for the case where configured topic is blank
                    storedData.topic = msg.topic
                } else {
                    // otherwise remove msg.payload so the clients do not action it
                    delete msg.payload
                }

                // check whether msg.enabled is present
                if ("enabled" in msg) {
                    storedData.enabled = msg.enabled
                }

                // store the latest values in our Node-RED datastore
                base.stores.data.save(base, node, storedData)
                // don't call send(msg) as we don't want to pass the message on to connected nodes
            },
            onSocket: {
                /*
                'my-custom-event': function (conn, id, msg) {
                    console.info('"my-custom-event" received:', conn.id, id, msg)
                    console.info('conn.id:', conn.id)
                    console.info('id:', id)
                    console.info('msg:', msg)
                    console.info('node.id:', node.id)
                    // emit a msg in Node-RED from this node
                    node.send(msg)
                }
                */
            }
        }

        // inform the dashboard UI that we are adding this node
        if (group) {
            group.register(node, config, evts)
        } else {
            node.error('No group configured')
        }
    }

    RED.nodes.registerType('ui-dropdown-cdl', UIDropdownCDLNode)
}
