(function(i,n){typeof exports=="object"&&typeof module<"u"?n(exports,require("vuex"),require("vue")):typeof define=="function"&&define.amd?define(["exports","vuex","vue"],n):(i=typeof globalThis<"u"?globalThis:i||self,n(i["ui-dropdown-cdl"]={},i.vuex,i.Vue))})(this,function(i,n,a){"use strict";const u=(e,t)=>{const o=e.__vccOpts||e;for(const[p,s]of t)o[p]=s;return o},d={name:"UIDropdownCDL",inject:["$socket"],props:{id:{type:String,required:!0},props:{type:Object,default:()=>({})},state:{type:Object,default:()=>({enabled:!1,visible:!1})}},setup(e){},data(){return{value:"",disabled:!1,fromManual:!1,topic:null,ui_update:{},class:""}},computed:{...n.mapState("data",["messages"]),color:function(){let e="";return this.fromManual&&(e=this.props.waitingcolor??""),e},options:function(){return(this.ui_update.options?this.ui_update.options:this.props.options).map(t=>t.label)}},mounted(){this.$socket.on("widget-load:"+this.id,e=>{this.processMsg(e)}),this.$socket.on("msg-input:"+this.id,e=>{this.processMsg(e)}),this.pickupProperties(),this.$socket.emit("widget-load",this.id)},unmounted(){var e,t;(e=this.$socket)==null||e.off("widget-load:"+this.id),(t=this.$socket)==null||t.off("msg-input:"+this.id)},methods:{pickupProperties:function(){const e=this.props;this.topic=e.topic,e.options.forEach(t=>t.label=t.label.length>0?t.label:t.value)},processMsg:function(e){var t;if(e.payload){this.fromManual=!1;const p=(t=(this.ui_update.options?this.ui_update.options:this.props.options).find(s=>s.value===e.payload))==null?void 0:t.label;p!==this.value&&(this.value=p,this.valueFromMsg=!0),(!this.props.topic||this.props.topic.length===0)&&(this.topic=e.topic)}typeof e.ui_update=="object"&&!Array.isArray(e.ui_update)&&e.ui_update!==null&&(this.ui_update={...this.ui_update,...e.ui_update}),"enabled"in e&&(this.disabled=!e.enabled)}},watch:{value:function(){var e;if(this.valueFromMsg)this.valueFromMsg=!1;else{this.fromManual=!0;let t={};const o=this.ui_update.options?this.ui_update.options:this.props.options;t.payload=(e=o.find(p=>p.label===this.value))==null?void 0:e.value,t.topic=this.topic,this.$socket.emit("widget-action",this.id,t)}}}};function r(e,t,o,p,s,l){const h=a.resolveComponent("v-select");return a.openBlock(),a.createElementBlock("div",{className:"ui-dropdown-cdl-wrapper",class:a.normalizeClass(s.class)},[a.createVNode(h,{label:o.props.label,variant:"outlined",modelValue:s.value,"onUpdate:modelValue":t[0]||(t[0]=f=>s.value=f),"hide-details":"",items:l.options,"bg-color":l.color,disabled:s.disabled},null,8,["label","modelValue","items","bg-color","disabled"])],2)}const c=u(d,[["render",r],["__scopeId","data-v-65fbd9d9"]]);i.UIDropdownCDL=c,Object.defineProperty(i,Symbol.toStringTag,{value:"Module"})});
