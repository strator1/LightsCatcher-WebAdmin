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

            this.addMouseEvents();
         },

         addMouseEvents: function() {
            var that = this;
            var imageWrapper = $($(this.getParent().getDomRef()).children()[0])
            this.$dragging = null;
            this.isDragging = false;

            $(imageWrapper).on("mousedown", "div", function(e) {
               $(this).attr("unselectable", "on").addClass('draggable');

               var el_w = $('.draggable').outerWidth(),
                  el_h = $('.draggable').outerHeight();

               that.$dragging = $(e.target);

               $(imageWrapper).on("mousemove", function(e) {
                  if (that.isDragging) {
                     that.$dragging.offset({
                        top: e.pageY - el_h / 2,
                        left: e.pageX - el_w / 2
                     });
                  }
               });

               that.isDragging = true;
            }).on("mouseup", ".draggable", function(e) {
               //update rel Pos on image
               var filtered = that.lightsOnImage.filter(function(l) {
                  return l.id === that.$dragging.attr("id");
               });

               if (filtered.length > 0) {
                  that.updateRelImagePos(filtered[0].light, that.$dragging);
               }
               that.isDragging = false;
               $(this).removeAttr("unselectable").removeClass('draggable');

               that.onResize();
            });

         },

         updateRelImagePos: function(light, newPos) {
            var parent = newPos.offsetParent();
            var imageSize = this.imgSize;

            // 1. get abs. pos of marker in current imageSize
            var absX = newPos.offset().left - parent.offset().left - imageSize.x + 5; //plus marker width
            var absY = newPos.offset().top - parent.offset().top - imageSize.y + 5; //plus marker height

            if (absX < 0 || absY < 0 || absX > imageSize.w || absY > imageSize.h) return;

            if (imageSize.w > imageSize.h) {
               light.x = 1 - (absY / imageSize.h);
               light.y = absX / imageSize.w;
            } else {
               light.x = absX / imageSize.w;
               light.y = absY / imageSize.h;
            }

            //light.element = newPos;
         },

         addImageMarker: function(light) {
            var imageWrapper = $($(this.getParent().getDomRef()).children()[0]);
            var id = this._guid();
            var d = $(document.createElement('div'));
            d.attr("id", id);
            d.addClass("image-marker").appendTo(imageWrapper);

            var markerPos = this.getMarkerCoordinates(light);

            d.css('top', markerPos.y);
            d.css('left', markerPos.x);
            d.css('background-color', light.phase == 0 ? 'rgba(255, 0, 0, 0.68)' : 'rgba(0, 128, 0, 0.68)');

            if (light.isMostRelevant) {
               d.css('border', '1px solid yellow');
            } else {
               d.css('border', light.phase == 0 ? '1px solid red' : '1px solid green');
            }

            this.lightsOnImage.push({
               id: id,
               light: light,
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
               var markerPos = that.getMarkerCoordinates(l.light);

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
         },

         _guid: function() {
            function s4() {
               return Math.floor((1 + Math.random()) * 0x10000)
                  .toString(16)
                  .substring(1);
            }

            return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
               s4() + '-' + s4() + s4() + s4();
         }

      });
   });
