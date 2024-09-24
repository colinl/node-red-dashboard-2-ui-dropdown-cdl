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
            beforeSend: function (msg) {
                console.log(`beforeSend msg: ${JSON.stringify(msg)}`)
                console.log(`options in state store: ${JSON.stringify(base.stores.state.getProperty(node.id, "options"))}`)
                // check for any dynamic properties being set


                /*
                const updates = msg.ui_update
                if (updates) {
                    if (typeof updates.example !== 'undefined') {
                        // save the "example" property in the Node-RED statestore
                        base.stores.state.set(base, node, msg, 'example', updates.example)
                    }
                } */
                return msg
            },
            onInput: function (msg, send, done) {
                console.log(`onInput msg: ${JSON.stringify(msg)}`)
                // does msg.ui_update exist and is an object?
                if (typeof msg.ui_update === 'object' && !Array.isArray(msg.ui_update) && msg.ui_update !== null) {
                    // array of properties to allow ui_update for.
                    const propertiesToUpdate = ["options"]
                    // do any pre-processing required of the contents and add to updates
                    for (const [key, value] of Object.entries(msg.ui_update)) {
                        if (propertiesToUpdate.includes(key)) {
                            // handle any properties that need massaging
                            const val = handleSpecialProperty(key, value)
                            if (value != null) {
                                msg.ui_update[key] = val
                            } else {
                                // null means that there is a problem with the data so ignore it.
                                delete msg.ui_update[key]
                            }
                        } else {
                            // this property is not updateable, so remove it from ui_update
                            delete msg.ui_update[key]
                        }
                    }
                } else {
                    // invalid ui_update so delete it
                    delete msg.ui_update
                }
                // if msg.topic exists, a payload is present, and the configured topic is empty then set msg.ui_update.topic
                // so it will be saved
                if ("topic" in msg  &&  "payload" in msg && config.topic.length == 0) {
                    msg.ui_update ||= {}
                    msg.ui_update.topic = msg.topic
                }

                // update state store with values from msg.ui_update
                if (msg.ui_update) {
                    for (const [key, value] of Object.entries(msg.ui_update)) {
                        base.stores.state.set(base, node, msg, key, value)
                    }
                }

                // only store the message in our Node-RED datastore if payload is present, so that
                // the last selection will get replayed on refresh
                if ("payload" in msg) {
                    base.stores.data.save(base, node, msg)
                }

                // don't call send(msg) as we don't want to pass the message on to connected nodes
                //if (props.passthrough) send(msg)
                return
            },
            onSocket: {
                /* this is an example of how to implement a custom event message from the client
                'update-statestore': function(conn, id, msg) {
                    //console.info(`update-statestore received from node ${id} by ${node.id} containing`, msg)
                    // check if this is from my node
                    if (id === node.id) {
                        console.info(`update-statestore received from node ${id} by ${node.id} containing`, msg)
                    }
                    // can use node.send() here if need to send a message to connected nodes
                },
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
