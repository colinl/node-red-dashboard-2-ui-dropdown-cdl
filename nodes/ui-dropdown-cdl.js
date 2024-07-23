module.exports = function (RED) {
    function UIDropdownCDLNode (config) {
        RED.nodes.createNode(this, config)

        const node = this

        // which group are we rendering this widget
        const group = RED.nodes.getNode(config.group)

        const base = group.getBase()

        // server-side event handlers
        const evts = {
            onAction: true,
            onInput: function (msg, send, done) {
                //console.log(`onInput msg: ${JSON.stringify(msg)}`)
                let updates = {} // this will be a set of properties to be merged into the state store here and props in the
                let updatesPresent = false // whether there are any updates
                // does msg.ui_update exist and is an object?
                if (typeof msg.ui_update === 'object' && !Array.isArray(msg.ui_update) && msg.ui_update !== null) {
                    // array of properties to allow ui_update for.
                    // We need to include class and enabled even though they are handled automatically, as they must be
                    // fed to the clients
                    const propertiesToUpdate = ["options", "enabled", "class"]
                    // do any pre-processing required of the contents and add to updates
                    for (const [key, value] of Object.entries(msg.ui_update)) {
                        if (propertiesToUpdate.includes(key)) {
                            // handle any properties that need massaging
                            const val = handleSpecialProperty(key, value)
                            if (value != null) {    // is this right ????????????????????/
                                // null means that there is a problem with the data so ignore it.
                                updatesPresent = true
                                updates[key] = val
                            }
                        }
                    }
                }
                // also allow class and enabled to set directly via msg.class and msg.enabled
                ["class", "enabled"].forEach((item) => {
                    if (item in msg) {
                        updatesPresent = true
                        updates[item] = msg[item]
                    }
                })
                // if msg.topic exists then save that as a new property, as need to be able to check if configured
                // topic is empty, but only do it if msg.payload is present
                if ("topic" in msg  &&  "payload" in msg) {
                    updatesPresent = true
                    updates.topicUpdated = msg.topic
                }

                // only store the message in our Node-RED datastore if payload is present, so that
                // the last selection will get replayed on refresh
                if ("payload" in msg) {
                    base.stores.data.save(base, node, msg)
                }

                // if we have any updates, save them in the state store then send to clients
                if (updatesPresent) {
                    const statestore = base.stores.state
                    // there are updates, so update state store
                    for (const [key, value] of Object.entries(updates)) {
                        statestore.set(base, node, msg, key, value)
                    }
                    //console.log(`sending updates to widget-updates:${node.id}`)
                    base.emit('widget-updates:' + node.id, {_updates: updates}, node)
                }
                // don't call send(msg) as we don't want to pass the message on to connected nodes
                //if (props.passthrough) send(msg)
                return
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

    /** given a key and value from msg.ui_update does any
     * manipulation of the value required and returns the new (or original) value
     */
    function handleSpecialProperty(key, val) {
        let answer = val
        switch (key) {
            case "options":
                // key is "options" and val should be an array of options
                if (!Array.isArray(val)) {
                    console.error("msg.ui_update.options is not an array")
                    answer = null
                } else {
                    answer = val.map((option) => {
                        let completeOption;
                        if (typeof option === "string") {
                            completeOption = { value: option, label: option }
                        } else {
                            completeOption = option
                            // fill in the labels if not provided
                            if (!completeOption.label || completeOption.label.length == 0) {
                                completeOption.label = completeOption.value
                            }
                        }
                        return completeOption
                    })
                }
                break;

        }
        return answer
    }

    RED.nodes.registerType('ui-dropdown-cdl', UIDropdownCDLNode)
}
