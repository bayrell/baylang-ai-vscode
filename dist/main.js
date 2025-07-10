(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('vue')) :
  typeof define === 'function' && define.amd ? define(['vue'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.Vue));
})(this, (function (vue) { 'use strict';

  var _export_sfc = (sfc, props) => {
    const target = sfc.__vccOpts || sfc;
    for (const [key, val] of props) {
      target[key] = val;
    }
    return target;
  };

  const _sfc_main = {
  	name: "Chat",
  	data: function(){
  		return {
  			message: "",
  		};
  	},
  	methods: {
  		getMessages()
  		{
  			return this.layout.history;
  		},
  		send: function(e)
  		{
  			this.layout.sendMessage(this.message);
  			this.message = "";
  		},
  	},
  };

  const _hoisted_1 = { class: "chat" };
  const _hoisted_2 = { class: "history" };
  const _hoisted_3 = { class: "send_message" };

  function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
    return (vue.openBlock(), vue.createElementBlock("div", _hoisted_1, [
      vue.createElementVNode("div", _hoisted_2, [
        (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList($options.getMessages(), (message) => {
          return (vue.openBlock(), vue.createElementBlock("div", {
            class: "history_item",
            key: message
          }, vue.toDisplayString(message), 1 /* TEXT */))
        }), 128 /* KEYED_FRAGMENT */))
      ]),
      vue.createElementVNode("div", _hoisted_3, [
        vue.withDirectives(vue.createElementVNode("input", {
          "onUpdate:modelValue": _cache[0] || (_cache[0] = $event => ((_ctx.message) = $event))
        }, null, 512 /* NEED_PATCH */), [
          [vue.vModelText, _ctx.message]
        ]),
        vue.createElementVNode("button", {
          onClick: _cache[1] || (_cache[1] = (...args) => ($options.send && $options.send(...args)))
        }, "Send")
      ])
    ]))
  }
  var Chat = /*#__PURE__*/_export_sfc(_sfc_main, [['render',_sfc_render],['__scopeId',"data-v-f9ff82d8"]]);

  class Layout {
      
      /**
       * Constructor
       */
      constructor()
      {
          this.history = [];
      }
      
      
      /**
       * Send message
       */
      sendMessage(message)
      {
          this.history.push(message);
      }
  }

  /* Create layout */
  let layout = vue.reactive(new Layout());

  /* Register layout */
  const registerLayout = (layout) => {
  	return {
  		install: (app) => {
  			app.config.globalProperties.layout = layout;
  		},
  	};
  };

  /* Create app */
  const app = vue.createApp(Chat);
  app.use(registerLayout(layout));

  /* Mount app */
  app.mount(".app");

}));
//# sourceMappingURL=main.js.map
