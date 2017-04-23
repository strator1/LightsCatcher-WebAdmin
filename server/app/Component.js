sap.ui.define(["sap/ui/core/UIComponent", "sap/ui/model/json/JSONModel"],

   function(UIComponent, JSONModel) {
      "use strict";

      return UIComponent.extend("LightsCatcher.Component", {
         metadata: {
            manifest: "json"
         },

         /**
          * The component is initialized by UI5 automatically during the startup
          * of the app and calls the init method once.
          *
          * @public
          * @override
          */
         init: function() {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);
            this.getRouter().initialize();
         }
         
      });

   });