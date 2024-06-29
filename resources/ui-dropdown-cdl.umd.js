(function() {
  "use strict";
  try {
    if (typeof document != "undefined") {
      var elementStyle = document.createElement("style");
      elementStyle.appendChild(document.createTextNode("/* CSS is auto scoped, but using named classes is still recommended */\n    /* Put css for node in here */"));
      document.head.appendChild(elementStyle);
    }
  } catch (e) {
    console.error("vite-plugin-css-injected-by-js", e);
  }
})();
(function(global, factory) {
  typeof exports === "object" && typeof module !== "undefined" ? factory(exports, require("vuex"), require("vue")) : typeof define === "function" && define.amd ? define(["exports", "vuex", "vue"], factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, factory(global["ui-dropdown-cdl"] = {}, global.vuex, global.Vue));
})(this, function(exports2, vuex, vue) {
  "use strict";
  const _export_sfc = (sfc, props) => {
    const target = sfc.__vccOpts || sfc;
    for (const [key, val] of props) {
      target[key] = val;
    }
    return target;
  };
  const _sfc_main = {
    name: "UIDropdownCDL",
    inject: ["$socket"],
    props: {
      /* do not remove entries from this - Dashboard's Layout Manager's will pass this data to your component */
      id: { type: String, required: true },
      props: { type: Object, default: () => ({}) },
      state: { type: Object, default: () => ({ enabled: false, visible: false }) }
    },
    setup(props) {
    },
    data() {
      return {
        value: "",
        disabled: false,
        fromManual: false,
        // indicates that the current state is from a manual click
        topic: null,
        class: ""
      };
    },
    computed: {
      ...vuex.mapState("data", ["messages"]),
      color: function() {
        let answer = "";
        if (this.fromManual) {
          answer = this.props.waitingcolor ?? "";
        }
        return answer;
      }
    },
    mounted() {
      this.$socket.on("widget-load:" + this.id, (msg) => {
        this.processMsg(msg);
      });
      this.$socket.on("msg-input:" + this.id, (msg) => {
        this.processMsg(msg);
      });
      console.log(`mounted, props: ${JSON.stringify(this.props)}`);
      this.pickupProperties();
      this.$socket.emit("widget-load", this.id);
    },
    unmounted() {
      var _a, _b;
      (_a = this.$socket) == null ? void 0 : _a.off("widget-load:" + this.id);
      (_b = this.$socket) == null ? void 0 : _b.off("msg-input:" + this.id);
    },
    methods: {
      pickupProperties: function() {
        const props = this.props;
        this.topic = props.topic;
        props.options.forEach((option) => option.label = option.label.length > 0 ? option.label : option.value);
        console.log(`after pickupProperites: ${JSON.stringify(props.options)}`);
      },
      processMsg: function(msg) {
        var _a;
        if (msg.payload) {
          this.fromManual = false;
          const label = (_a = this.props.options.find((option) => option.value === msg.payload)) == null ? void 0 : _a.label;
          if (label !== this.value) {
            this.value = label;
            this.valueFromMsg = true;
          }
          if (!this.props.topic || this.props.topic.length === 0) {
            this.topic = msg.topic;
          }
        }
        if ("enabled" in msg) {
          this.disabled = !msg.enabled;
        }
      }
    },
    watch: {
      value: function() {
        var _a;
        console.log(`value change: ${this.value}`);
        if (this.valueFromMsg) {
          this.valueFromMsg = false;
        } else {
          this.fromManual = true;
          let msg1 = {};
          msg1.payload = (_a = this.props.options.find((option) => option.label === this.value)) == null ? void 0 : _a.value;
          msg1.topic = this.topic;
          this.$socket.emit("widget-action", this.id, msg1);
        }
      }
    }
  };
  function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_v_select = vue.resolveComponent("v-select");
    return vue.openBlock(), vue.createElementBlock(
      vue.Fragment,
      null,
      [
        vue.createCommentVNode(" Component must be wrapped in a block so props such as className and style can be passed in from parent "),
        vue.createElementVNode(
          "div",
          {
            className: "ui-dropdown-cdl-wrapper",
            class: vue.normalizeClass($data.class)
          },
          [
            vue.createVNode(_component_v_select, {
              label: $props.props.label,
              variant: "outlined",
              modelValue: $data.value,
              "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $data.value = $event),
              "hide-details": "",
              items: $props.props.options.map((option) => option.label),
              "bg-color": $options.color,
              disabled: $data.disabled
            }, null, 8, ["label", "modelValue", "items", "bg-color", "disabled"])
          ],
          2
          /* CLASS */
        )
      ],
      2112
      /* STABLE_FRAGMENT, DEV_ROOT_FRAGMENT */
    );
  }
  const UIDropdownCDL = /* @__PURE__ */ _export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-9ee7bdb5"], ["__file", "/home/colinl/nodes/node-red-dashboard-2-ui-dropdown-cdl/ui/components/UIDropdownCDL.vue"]]);
  exports2.UIDropdownCDL = UIDropdownCDL;
  Object.defineProperty(exports2, Symbol.toStringTag, { value: "Module" });
});
