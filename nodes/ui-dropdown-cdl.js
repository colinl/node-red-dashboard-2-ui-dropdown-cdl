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
                // does msg.ui_update exist and is an object?
                if (typeof msg.ui_update === 'object' && !Array.isArray(msg.ui_update) && msg.ui_update !== null) {
                    // array of properties to allow ui_update for. No need to include class or className, they are handled automatically
                    const propertiesToUpdate = ["options"]
                    // yes it does, do any pre-processing required of the contents
                    msg.ui_update = handleSpecialPropertyUpdate(msg.ui_update)
                    // merge data into the properties in the state store
                    let statestore = base.stores.state
                    for (const [key, value] of Object.entries(msg.ui_update)) {
                        if (propertiesToUpdate.includes(key)) {
                            statestore.set(base, node, msg, key, value)
                        }
                    }
                }
                // if msg.topic exists then save that as a new property, as need to be able to check if configured
                // topic is empty, but only do it if msg.payload is present
                if ("topic" in msg  &&  "payload" in msg) {
                    base.stores.state.set(base, node, msg, "topicUpdated", msg.topic)
                } else {
                    // otherwise remove the topic if present
                    delete msg.topic
                }
                // msg.enabled is handled by the core code, updating the value in props when necessary

                // only store the message in our Node-RED datastore if payload is present, so that
                // the last selection will get replayed on refresh
                if ("payload" in msg) {
                    base.stores.data.save(base, node, msg)
                }
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

    function handleSpecialPropertyUpdate(ui_update) {
        // given a msg.ui_update object this massages any properties that need special handling
        if (ui_update.options) {
            // this may be an array of strings, an array of objects containing {value: "value"} or
            // an array of objects containing {value: "value", label: "label"}
            // Note that they must all be strings
            if (!Array.isArray(ui_update.options)) {
                console.error("msg.ui_update.options is not an array")
            } else {
                ui_update.options = ui_update.options.map((option) => {
                    let answer;
                    if (typeof option === "string") {
                        answer = {value: option, label: option}
                    } else {
                        answer = option
                        // fill in the labels if not provided
                        if (!answer.label || answer.label.length == 0) {
                            answer.label = answer.value
                        }
                    }
                    return answer
                })
            }
        }
        return ui_update
    }

    RED.nodes.registerType('ui-dropdown-cdl', UIDropdownCDLNode)
}
