sap.ui.define(["sap/ui/core/mvc/Controller", "sap/ui/model/json/JSONModel", "LightsCatcher/helpers/formatter"],

   function(Controller,
            JSONModel, formatter) {
      "use strict";

      var me = Controller.extend("LightsCatcher.controller.Home", {
         formatter: formatter,

         onInit: function() {
            this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            this.oRouter.getRoute("home").attachPatternMatched(this._onRouteMatched, this);

            this.lightsModel = new JSONModel({});
            this.getView().setModel(this.lightsModel, "lightsModel");

            this.oTable = this.getView().byId("idLightsTable");

            me = this;
         },

         _onRouteMatched: function(oEvent) {
            var oArgs = oEvent.getParameter("arguments");
            var oQuery = oArgs["?query"];

            $.get("/api/lights", function(data) {
               me.lightsModel.setData(data.data);
            });
         }

      });

      return me;
   });