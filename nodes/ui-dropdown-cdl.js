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
                    // yes it does, do any pre-processing required of the contents
                    msg.ui_update = handleSpecialPropertyUpdate(msg.ui_update)
                    storedData.ui_update ??= {}    // initialise if necessary
                    // merge in data from this message
                    storedData.ui_update = {...storedData.ui_update, ...msg.ui_update}
                }

                // is msg.payload a valid selection in the current options (from config or ui_update)?
                const theOptions = storedData.ui_update?.options ? storedData.ui_update.options : config.options
                if (typeof msg.payload === "string" && theOptions.find((option) => option.value === msg.payload)) {
                    storedData.payload = msg.payload
                    // also store the topic in this case, for the case where configured topic is blank
                    storedData.topic = msg.topic
                } else {
                    // otherwise remove msg.payload so the clients do not action it
                    delete msg.payload
                }

                // msg.enabled is handled by the core code, updating the value in props when necessary

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
