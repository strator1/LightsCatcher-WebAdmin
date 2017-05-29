sap.ui.define(["sap/ui/core/mvc/Controller", "sap/ui/model/json/JSONModel", "LightsCatcher/helpers/formatter", "sap/m/MessageBox", "sap/m/MessageToast", "LightsCatcher/control/LightBox",
      "LightsCatcher/control/LightBoxItem", "sap/m/Dialog", "sap/m/Text", "sap/m/Button"],

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

            this.userModel = new JSONModel({});
            this.getView().setModel(this.userModel, "userModel");

            this.viewModel = new JSONModel({
               busy: false,
               showApproved: false
            });

            this.getView().setModel(this.viewModel, "viewModel");

            this.selectedLights = [];
            this.delayedSearch = null;

            this.oPage = this.getView().byId("idHomePage");
            this.oTable = this.getView().byId("idLightsTable");
            this.oMap = this.getView().byId("mapHtml");
            this.oMap.setContent("<div id='map' style='height:100%'/>");
            this.oUserSearchField = this.getView().byId("userSearchField");
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

         initMap: function() {
            var map = new google.maps.Map(document.getElementById('map'), {
               zoom: 12,
               center: {lat: 48.3583992, lng: 10.8614402},
               clickableIcons: true
            });

            var image = 'http://www.hs-augsburg.de/~strator/ampel/traffic-light.png';

            var infowindow = new google.maps.InfoWindow({
               content: "<div id=\"header\"></div><canvas id=\"canvas\" height=\"350\" width=\"300\"></canvas><div id=\"user\"></div><div id=\"timestamp\"></div><div id=\"coordinates\"></div>",
               width: 300,
               height: 350,
               maxWidth: 300,
               maxHeight: 350
            });

            var uri = "/api/lights?approved=true";

            $.get(uri, function(result) {
               result.data.forEach(function(d) {
                  var latitude = Number(d.latitude);
                  var longitude = Number(d.longitude);
                  var imageUrl = d.imageUrl;
                  var createdAt = d.createdAt;
                  var username = d.user;

                  var geocoder = new google.maps.Geocoder();

                  var marker = new google.maps.Marker({
                     position: {lat: latitude, lng: longitude},
                     map: map,
                     icon: image,
                     clickable: true
                  });
                  marker.addListener('click', function() {
                     infowindow.open(map, marker);

                     var latlng = {lat: parseFloat(latitude), lng: parseFloat(longitude)};
                     geocoder.geocode({'location': latlng}, function(results, status) {
                        if (status === 'OK') {
                           var header=document.getElementById("header");
                           header.innerHTML = "<b>" + results[1].formatted_address + "</b>";
                        }
                     });

                     var coordinates=document.getElementById("coordinates");
                     coordinates.innerHTML = "latitude: " + latitude + "<br/>" + "longitude: " + longitude;
                     var user=document.getElementById("user");
                     user.innerHTML = "User: " + username;
                     var timestamp=document.getElementById("timestamp");
                     timestamp.innerHTML = "Datum: " + moment(new Date(Number.parseInt(createdAt))).format("dddd, DD.MM.YYYY HH:mm");

                     var canvas=document.getElementById("canvas");
                     var ctx=canvas.getContext("2d");
                     ctx.clearRect(0, 0, canvas.width, canvas.height);

                     var img = loadImage(
                        imageUrl,
                        function(imag) {
                           imag = loadImage.scale(imag, {maxHeight: 300});
                           if (imag.width > imag.height) {
                              ctx.translate(canvas.width/2, canvas.height/2);
                              ctx.rotate(Math.PI / 2);
                              ctx.drawImage(imag, -imag.width/2, -imag.height/2, imag.width, imag.height);
                              ctx.rotate(-Math.PI / 2);
                              ctx.translate(-canvas.width/2, -canvas.height/2);
                           } else {
                              ctx.drawImage(imag, 0, 0, imag.width, imag.height);
                           }
                        },
                        {
                           orientation: true,
                           crossOrigin: false
                        }
                     );
                  });
               });
            });
         },

         onTabSelect: function(oEvent) {
            var selectedKey = oEvent.getParameter("selectedKey");
            switch (selectedKey) {
               case "map":
                  this.initMap();
                  break;
               default:
                  break;
            }
         },

         loadLights: function(bSurpressMessage, byUser) {
            bSurpressMessage = bSurpressMessage === undefined ? false : bSurpressMessage;
            this.oTable.setBusy(true);

            var uri = byUser === undefined || byUser == null ? "/api/lights" : "/api/lights?user=" + byUser;

            if (byUser === undefined || byUser == null) {
               uri = this.viewModel.getProperty("/showApproved") ? uri + "?approved=true" : uri + "?approved=false";
            }

            $.get(uri, function(data) {
               data.data.forEach(function(d) {
                  if (!d.hasOwnProperty("lightPositions")) {
                     d.lightPhases = "-";
                     return;
                  }

                  if (!d.lightPositions instanceof Array) return;

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
            var lightPositions = light.hasOwnProperty("lightPositions") ? light.lightPositions : [];
            var copiedPositions = JSON.parse(JSON.stringify(lightPositions));

            this.lightBox = new LightBox({
               imageContent: new LightBoxItem({
                  imageSrc: light.imageUrl,
                  lights: copiedPositions,
                  alt: "Alt"
               }),
               onApprove: function(oEvent) {
                  var that = this;
                  var newLights = oEvent.getParameter("newLights");

                  var put = $.ajax({
                     url: "/api/lights/positions/" + light.key,
                     type: 'PUT',
                     data: {positions: JSON.stringify(newLights)}
                  });

                  this.setBusy(true);
                  put.success(function(data) {
                     light.lightPositions = newLights;
                     me.approvePicture.apply(me, [light]);
                     that.setBusy(false);
                  });

                  put.error(function(data) {
                     //Show error dialog
                     that.setBusy(false);
                     MessageBox.error(data.msg);
                  });
               }
            });

            this.lightBox.open();
         },

         approvePicture: function(light) {
            var put = $.ajax({
               url: "/api/lights/" + light.key + "/approve",
               type: 'PUT'
            });

            put.success(function(data) {
               if (!light.hasOwnProperty("approved")) {
                  me.removePictureFromModel(light);
               } else {
                  me.lightsModel.refresh();
               }
               MessageToast.show("Picture saved and approved!");
               me.lightBox.close();
            });

            put.error(function(data) {
               //Show error dialog
               MessageBox.error(data.msg);
            });
         },

         onShowApprovedPress: function(oEvent) {
            this.loadLights(true, this.oUserSearchField.getValue() !== "" ? this.oUserSearchField.getValue() : null);
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
               this.removePictureFromModel(light);

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
               this.removePictureFromModel(light);

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

         removePictureFromModel: function(light) {
            var index = this.lightsModel.oData.indexOf(light);
            this.lightsModel.oData.splice(index, 1);
            this.lightsModel.refresh();
         },

         onShowUserDetailsPress: function(oEvent) {
            this.uid = oEvent.getSource().getBindingContext("lightsModel").getObject().user;

            this._getUserDetailDialog().open();

            this._getUserDetailDialog().setBusy(true);
            var get = $.ajax({
               url: "/api/users/" + this.uid,
               type: 'GET'
            });

            get.success(function(data) {
               me.userModel.setData(data.data);
               me._getUserDetailDialog().setBusy(false);
            });

            get.error(function(data) {
               //Show error dialog
               me._getUserDetailDialog().setBusy(false);
               MessageBox.error(data.msg);
            });
         },

         updateUser: function() {
            var put = $.ajax({
               url: "/api/users/" + this.uid,
               type: 'PUT',
               data: this.userModel.oData
            });

            this._getUserDetailDialog().setBusy(true);
            put.success(function(data) {
               MessageToast.show("User updated!");
               me._getUserDetailDialog().setBusy(false);
            });

            put.error(function(data) {
               //Show error dialog
               me._getUserDetailDialog().setBusy(false);
               MessageBox.error(data.msg);
            });
         },

         onSearchByUser: function(oEvent) {
            var sQuery = oEvent.getSource().getValue();
            var that = this;
            clearTimeout(this.delayedSearch);

            if (sQuery && sQuery.length > 0) {
               this.delayedSearch = setTimeout(this.loadLights.bind(this, true, sQuery), 400);
            } else {
               this.loadLights(true);
            }
         },

         onSearchByUserPress: function(oEvent) {
            var uid = oEvent.getSource().getBindingContext("lightsModel").getObject().user;
            this.oUserSearchField.setValue(uid);
            this.loadLights(true, uid);
            this.oPage.scrollTo(0,0);
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

         _getUserDetailDialog: function() {

            if (!this._userDetailDialog) {

               this._userDetailContent = sap.ui.xmlfragment("userDetailPopover",
                  "LightsCatcher.view.UserDetailContent", this);

               this._userDetailDialog = new Dialog({
                  title: "User Information",
                  content: this._userDetailContent,
                  beginButton: new Button({
                     text: "Save",
                     press: function() {
                        me.updateUser();
                        this.getParent().close();
                     }
                  }),
                  endButton: new Button({
                     text: "Cancel",
                     press: function() {
                        this.getParent().close();
                     }
                  }),
                  beforeOpen: function() {
                     me.userModel.setData({});
                  },
                  afterClose: function() {
                     //			this.destroy();
                  }
               });

               this.getView().addDependent(this._userDetailDialog);
            }

            return this._userDetailDialog;
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