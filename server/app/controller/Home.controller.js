sap.ui.define(["sap/ui/core/mvc/Controller", "sap/ui/model/json/JSONModel", "LightsCatcher/helpers/formatter", "sap/m/MessageBox", "sap/m/MessageToast", "sap/m/LightBox",
      "sap/m/LightBoxItem", "sap/m/Dialog", "sap/m/Text", "sap/m/Button"],

   function(Controller,
            JSONModel, formatter, MessageBox, MessageToast, LightBox, LightBoxItem, Dialog, Text, Button) {
      "use strict";

      var me = Controller.extend("LightsCatcher.controller.Home", {
         formatter: formatter,

         onInit: function() {
            this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            this.oRouter.getRoute("home").attachPatternMatched(this._onRouteMatched, this);

            this.lightsModel = new JSONModel({});
            this.getView().setModel(this.lightsModel, "lightsModel");

            this.viewModel = new JSONModel({
               busy: false
            });

            this.getView().setModel(this.viewModel, "viewModel");

            this.selectedLights = [];

            this.oPage = this.getView().byId("idHomePage");
            this.oTable = this.getView().byId("idLightsTable");
            this.deleteSelectedBtn = this.getView().byId("idDeleteSelectedBtn");
            this.banAllSelectedBtn = this.getView().byId("idBanAllSelectedBtn");

            me = this;
         },

         _onRouteMatched: function(oEvent) {
            var oArgs = oEvent.getParameter("arguments");
            var oQuery = oArgs["?query"];

            this.oPage.setShowFooter(false);
            this.loadLights();
         },

         loadLights: function(bSurpressMessage) {
            bSurpressMessage = bSurpressMessage === undefined ? false : bSurpressMessage;
            this.oTable.setBusy(true);

            $.get("/api/lights", function(data) {
               data.data.forEach(function(d) {
                  if (!d.hasOwnProperty("lightPositions")) {
                     d.lightPhases = "-";
                     return;
                  }

                  var lightPhases = d.lightPositions.map(function(l) {
                     return l.phase == 0 ? "Red" : "Green";
                  });

                  d.lightPhases = lightPhases.join(", ");
               });

               me.lightsModel.setData(data.data);
               me.oTable.setBusy(false);

               if (bSurpressMessage) {
                  return;
               }

               MessageToast.show("Lights loaded");
            });
         },

         onTableSelectionChange: function(oEvent) {
            var listItems = this.oTable.getSelectedItems();

            this.deleteSelectedBtn.setEnabled(listItems.length > 0 ? true : false);
            this.deleteSelectedBtn.setText("Remove (" + listItems.length + ") selected");

            this.banAllSelectedBtn.setEnabled(listItems.length > 0 ? true : false);
            this.banAllSelectedBtn.setText("Remove & Ban (" + listItems.length + ") selected");

            this.selectedLights = listItems;

            this.oPage.setShowFooter(listItems.length > 0 ? true : false);
         },

         onRefreshListPressed: function() {
            this.loadLights();
         },

         onImagePressed: function(oEvent) {
            var light = oEvent.getSource().getBindingContext("lightsModel").getObject();

            var lightBox = new LightBox({
               imageContent: new LightBoxItem({
                  imageSrc: light.imageUrl,
                  alt: "Alt"
               })
            });

            lightBox.open();
         },

         onRemovePicturePress: function(oEvent) {
            var light = oEvent.getSource().getBindingContext("lightsModel").getObject();

            this._getDeleteConfirmationDialog("Are you sure you want to delete this picture?", this.removePicture.bind(this, light))
               .open();
         },

         onRemovePicAndUserPress: function(oEvent) {
            var light = oEvent.getSource().getBindingContext("lightsModel").getObject();

            this._getDeleteConfirmationDialog("Are you sure you want to delete the picture and ban the user?", this.removePictureAndBanUser.bind(this, light))
               .open();
         },

         onRemoveAllSelected: function(oEvent) {
            var keyUserData = this._getKeyUserData();

            this._getDeleteConfirmationDialog("Are you sure you want to delete " + keyUserData.length + " picture(s)?", this.removeMultiplePictures.bind(this, keyUserData, false))
               .open();
         },

         onRemoveBanAllSelected: function(oEvent) {
            var keyUserData = this._getKeyUserData();

            this._getDeleteConfirmationDialog("Are you sure you want to delete & ban " + keyUserData.length + " picture(s) and their users?", this.removeMultiplePictures.bind(this, keyUserData, true))
               .open();
         },

         removePicture: function(light, bExecute) {
            bExecute = bExecute === undefined ? true : bExecute;

            var del = $.ajax({
               url: "/api/lights/" + light.key,
               type: 'DELETE'
            });

            if (!bExecute) {
               return del;
            }

            del.success($.proxy(function(data) {
               //Remove light from model
               var index = this.lightsModel.oData.indexOf(light);
               this.lightsModel.oData.splice(index, 1);
               this.lightsModel.refresh();

               MessageToast.show(data.msg);
            }, me));

            del.error($.proxy(function(data) {
               //Show error dialog
               MessageBox.error(data.msg);
            }, me));
         },

         removePictureAndBanUser: function(light, bExecute) {
            bExecute = bExecute === undefined ? true : bExecute;

            var del = $.ajax({
               url: "/api/lights/" + light.key + "/" + light.user,
               type: 'DELETE'
            });

            if (!bExecute) {
               return del;
            }

            del.success($.proxy(function(data) {
               //Remove light from model
               var index = this.lightsModel.oData.indexOf(light);
               this.lightsModel.oData.splice(index, 1);
               this.lightsModel.refresh();

               MessageToast.show(data.msg);
            }, me));

            del.error($.proxy(function(data) {
               //Show error dialog
               MessageBox.error(data.msg);
            }, me));
         },

         removeMultiplePictures: function(keyData, bBanUsers) {
            bBanUsers = bBanUsers === undefined ? false : bBanUsers;

            this.oTable.setBusy(true);
            this.deleteSelectedBtn.setEnabled(false);
            this.banAllSelectedBtn.setEnabled(false);

            var deferreds = [];

            for (var i = 0; i < keyData.length; i++) {

               var deleteEntity = function(index, deferredsArray) {
                  var entity = keyData[index];

                  var remove = bBanUsers ? me.removePictureAndBanUser(entity, false) : me.removePicture(entity, false);

                  remove.success(function() {
                     deferredsArray[index].resolve();
                  });

                  remove.error(function() {
                     deferredsArray[index].reject();
                  });
               };

               deferreds[i] = new $.Deferred();
               deleteEntity(i, deferreds);
            }

            $.when.apply($, deferreds).then(function onSuccess() {
               me.deleteSelectedBtn.setEnabled(false);
               me.deleteSelectedBtn.setText("Remove selected");

               me.banAllSelectedBtn.setEnabled(false);
               me.banAllSelectedBtn.setText("Remove & Ban selected");

               me.selectedLights = [];
               me.oPage.setShowFooter(false);

               me.oTable.setBusy(false);
               me.oTable.removeSelections();

               MessageToast.show("All selected Photos removed!");
               me.loadLights(true);
            }, function onError() {
               me.oTable.setBusy(false);
               me.deleteSelectedBtn.setEnabled(true);
               me.banAllSelectedBtn.setEnabled(true);
               MessageBox.error("Something went wrong");
            });
         },

         _getDeleteConfirmationDialog: function(text, okayCb) {
            this._deleteConfirmationDialog = new Dialog({
               title: "Warning",
               type: 'Message',
               state: 'Warning',
               content: new Text({
                  text: "Test",
                  textAlign: 'Center',
                  width: '100%'
               }),
               beginButton: new Button({
                  text: "Yes",
                  press: function() {
                     okayCb();
                     this.getParent().close();
                  }
               }),
               endButton: new Button({
                  text: "No",
                  press: function() {
                     this.getParent().close();
                  }
               }),
               afterClose: function() {
                  //			this.destroy();
               }
            });

            if (text !== undefined) {
               this._deleteConfirmationDialog.getContent()[0].setText(text);
            }

            return this._deleteConfirmationDialog;
         },

         _getKeyUserData: function() {
            return this.selectedLights.map(function(l) {
               var light = l.getBindingContext("lightsModel").getObject();

               return {
                  key: light.key,
                  user: light.user
               };
            });
         }

      });

      return me;
   });