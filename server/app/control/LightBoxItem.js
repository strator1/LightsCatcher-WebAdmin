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
            this.markerSize = 10;

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
            this.onResize();
         },

         addMouseEvents: function() {
            var that = this;
            var imageWrapper = $($(this.getParent().getDomRef()).children()[1]);
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
               var filtered = that._getLightOnImageById(that.$dragging.attr("id"));

               if (filtered.length > 0) {
                  that.updateRelImagePos(filtered[0].light, that.$dragging);
               }

               $(this).removeAttr("unselectable").removeClass('draggable');

               that.onResize();
               setTimeout(function() {that.isDragging = false;}, 0);
               e.stopPropagation();
            });

            $(imageWrapper).on("click", function(e) {
               console.log("clicked");
               if (that.lights.length > 3) return;
               if (that.isDragging) return;

               var newLight = {
                  isMostRelevant: !that._mostRelevantExists(),
                  phase: 0,
                  x: 0,
                  y: 0
               };

               that.lights.push(newLight);

               that.updateRelImagePos(newLight, $(e.target), {
                  top: e.pageY - that.markerSize / 2,
                  left: e.pageX - that.markerSize / 2
               });
               that.addImageMarker(newLight);
            });

         },

         updateRelImagePos: function(light, newPos, customOffset) {
            var parent = newPos.offsetParent();
            var imageSize = this.imgSize;

            var offLeft = customOffset === undefined ? newPos.offset().left : customOffset.left;
            var offTop = customOffset === undefined ? newPos.offset().top : customOffset.top;

            // 1. get abs. pos of marker in current imageSize
            var absX = offLeft - parent.offset().left - imageSize.x + this.markerSize / 2; //plus marker width
            var absY = offTop - parent.offset().top - imageSize.y + this.markerSize / 2; //plus marker height

            if (absX < 0 || absY < 0 || absX > imageSize.w || absY > imageSize.h) return;

            if (imageSize.w > imageSize.h) {
               light.x = 1 - (absY / imageSize.h);
               light.y = absX / imageSize.w;
            } else {
               light.x = absX / imageSize.w;
               light.y = absY / imageSize.h;
            }

         },

         addImageMarker: function(light) {
            var imageWrapper = $($(this.getParent().getDomRef()).children()[1]);
            var id = this._guid();
            var d = $(document.createElement('div'));
            d.attr("id", id);
            d.addClass("image-marker").appendTo(imageWrapper);

            var markerPos = this.getMarkerCoordinates(light);

            d.css('top', markerPos.y);
            d.css('left', markerPos.x);

            this.applyMarkerStyle(d, light);

            var newLightOnImage = {
               id: id,
               light: light,
               element: d
            };

            d.on("dblclick", this.onElementDblClick.bind(this));
            d.on("contextmenu", this.onElementRightClick.bind(this));

            this.lightsOnImage.push(newLightOnImage);
         },

         applyMarkerStyle: function(element, light) {
            element.css('background-color', light.phase == 0 ? 'rgba(255, 0, 0, 0.68)' : 'rgba(0, 128, 0, 0.68)');
            this.setMarkerSize(element, this.markerSize);

            if (typeof light.isMostRelevant === "boolean" && light.isMostRelevant) {
               element.css('border', '1px solid yellow');
            } else if (typeof light.isMostRelevant === "boolean") {
               element.css('border', light.phase == 0 ? '1px solid red' : '1px solid green');
            } else if (light.isMostRelevant == 0) {
               element.css('border', '1px solid yellow');
            } else {
               element.css('border', light.phase == 0 ? '1px solid red' : '1px solid green');
            }
         },

         setMarkerSize: function(element, size) {
            element.css('width', this.markerSize + 'px');
            element.css('height', this.markerSize + 'px');
         },

         onElementDblClick: function(e) {
            console.log("Double Click");
            var lights = this._getLightOnImageById($(e.target).attr("id"));

            if (lights.length > 0) {
               var light = lights[0];
               light.light.phase = light.light.phase === 0 ? 1 : 0;
               this.applyMarkerStyle(light.element, light.light);
            }

            e.stopPropagation();
         },

         onElementRightClick: function(e) {
            e.preventDefault();
            console.log("rightClick");
            var lights = this._getLightOnImageById($(e.target).attr("id"));

            if (lights.length > 0) {
               var light = lights[0];
               var indexLightsOnImage = this.lightsOnImage.indexOf(light);
               var indexLights = this.lights.indexOf(light.light);

               if (indexLightsOnImage == -1 || indexLights == -1) return;

               light.element.remove();
               this.lightsOnImage.splice(indexLightsOnImage, 1);
               this.lights.splice(indexLights, 1);
            }

            this.isDragging = false;
            return false;
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

            this.markerSize = img.width > img.height ? img.height * 0.04 : img.width * 0.04;

            this.lightsOnImage.forEach(function(l) {
               var markerPos = that.getMarkerCoordinates(l.light);
               that.setMarkerSize(l.element, that.markerSize);
               l.element.css("top", markerPos.y);
               l.element.css("left", markerPos.x)
            });
         },

         getMarkerCoordinates: function(light) {
            light.x = light.x > 1 ? 0 : light.x;
            light.y = light.y > 1 ? 0 : light.y;
            
            var lightX = this.imgSize.w > this.imgSize.h ? light.y : light.x;
            var lightY = this.imgSize.w > this.imgSize.h ? (1 - light.x) : light.y;

            var x = (this.imgSize.w * lightX) + this.imgSize.x - this.markerSize / 2; //minus marker width
            var y = (this.imgSize.h * lightY) + this.imgSize.y - this.markerSize / 2; //minus marker height

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
         },

         _getLightOnImageById: function(id) {
            return this.lightsOnImage.filter(function(l) {
               return l.id === id;
            });
         },

         _mostRelevantExists: function() {
            for (var i = 0; i < this.lights.length; i++) {
               var light = this.lights[i];

               if (typeof light.isMostRelevant === "boolean" && light.isMostRelevant) {
                  return true;
               } else if (light.isMostRelevant == 0) {
                  return true;
               }
            }

            return false;
         }

      });
   });
