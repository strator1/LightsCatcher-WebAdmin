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

            this.loadLights();
         },

         loadLights: function() {
            this.oTable.setBusy(true);

            $.get("/api/lights", function(data) {
               me.lightsModel.setData(data.data);
               me.oTable.setBusy(false);
            });
         },

         onRefreshListPressed: function() {
            this.loadLights();
         },

         onRemovePicturePress: function(oEvent) {
            var light = oEvent.getSource().getBindingContext("lightsModel").getObject();

            var del = $.ajax({
               url : "/api/lights/" + light.key,
               type : 'DELETE'
            });

            del.success($.proxy(function(data) {
               //Remove light from model
               var index = this.lightsModel.oData.indexOf(light);
               this.lightsModel.oData.splice(index, 1);
               this.lightsModel.refresh();
            }, me));

            del.error($.proxy(function(data) {
               //Show error dialog
            }, me))
         },

         onRemovePicAndUserPress: function(oEvent) {
            var light = oEvent.getSource().getBindingContext("lightsModel").getObject();
            debugger;
         }

      });

      return me;
   });