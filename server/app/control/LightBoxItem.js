sap.ui.define(["sap/m/LightBoxItem"],

   function(LightBoxItem) {
      return LightBoxItem.extend("LightsCatcher.control.LightBoxItem", {
         metadata: {
            properties: {
               lights: {type: "object", multiple: true, singularName: "light", bindable: "bindable"}
            }
         },

         onImageLoaded: function() {
            var that = this;
            this._jImage = this.getAggregation("_image").getDomRef();
            this._jParent = this.getParent().getDomRef();

            this.lights = this.getLights();

            this.lightsOnImage = [];

            this.imgSize = {
               w: this._jImage.width,
               h: this._jImage.height,
               x: this._jImage.offsetLeft,
               y: this._jImage.offsetTop
            };

            this.lights.forEach(function(l) {
               that.addImageMarker(l);
            });

            $(window).resize(function() {
               that.onResize();
            });
         },

         addImageMarker: function(light) {
            var d = $(document.createElement('div'));
            var imageWrapper = $($(this.getParent().getDomRef()).children()[0]);
            d.addClass("image-marker").appendTo(imageWrapper);

            var markerPos = this.getMarkerCoordinates(light);

            d.css('top', markerPos.y);
            d.css('left', markerPos.x);
            d.css('background-color', light.phase == 0 ? 'rgba(255, 0, 0, 0.68)' : 'rgba(0, 128, 0, 0.68)');
            d.css('border', light.phase == 0 ? '1px solid red' : '1px solid green');

            this.lightsOnImage.push({
               x: light.x,
               y: light.y,
               element: d
            });
         },

         onResize: function() {
            var that = this;
            var img = this.getAggregation("_image").getDomRef();

            this.imgSize = {
               w: img.width,
               h: img.height,
               x: img.offsetLeft,
               y: img.offsetTop
            };

            this.lightsOnImage.forEach(function(l) {
               var markerPos = that.getMarkerCoordinates(l);

               l.element.css("top", markerPos.y);
               l.element.css("left", markerPos.x)
            });
         },

         getMarkerCoordinates: function(light) {
            var lightX = this.imgSize.w > this.imgSize.h ? light.y : light.x;
            var lightY = this.imgSize.w > this.imgSize.h ? (1 - light.x) : light.y;

            var x = (this.imgSize.w * lightX) + this.imgSize.x - 5; //minus marker width
            var y = (this.imgSize.h * lightY) + this.imgSize.y - 5; //minus marker height

            return {
               x: x,
               y: y
            }
         },

         _setImageState: function(sImageState) {
            if (LightBoxItem.prototype._setImageState) {
               LightBoxItem.prototype._setImageState.apply(this, arguments);
            }

            if (sImageState == sap.m.LightBoxLoadingStates.Loaded) {
               this.onImageLoaded();
            }
         }

      });
   });
