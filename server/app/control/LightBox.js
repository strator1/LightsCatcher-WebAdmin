sap.ui.define(["sap/m/LightBox", "sap/m/LightBoxRenderer", "sap/m/Button"],

   function(LightBox, LightBoxRenderer, Button) {
      return LightBox.extend("LightsCatcher.control.LightBox", {
         metadata: {
            aggregations: {
               _saveButton: {type: 'sap.m.Button', multiple: false, visibility: 'hidden'}
            },

            events: {
               onSave : {
                  parameters : {
                     lights : {type : "array"},
                  }
               }
            }
         },

         init: function() {
            if (LightBox.prototype.init) {
               LightBox.prototype.init.apply(this, arguments);
            }

            this._saveButtonText = "Save";
         },

         onSaveLights: function() {
            var lights = this._getImageContent().lights;
            this.fireEvent("onSave", {
               newLights: lights
            })
         },

         _getSaveButton: function () {
            var saveButton = this.getAggregation('_saveButton');

            if (!saveButton) {
               saveButton = new Button({
                  id: this.getId() + '-saveButton',
                  text: this._saveButtonText,
                  type: sap.m.ButtonType.Transparent,
                  press: function () {
                     this.onSaveLights();
                  }.bind(this)
               });
               this.setAggregation('_saveButton', saveButton, true);
            }

            return saveButton;
         },

         renderer: {
            renderFooter: function(oRm, oControl, oImageContent) {
               var classNameFooter = 'sapMLightBoxFooter';
               var classNameContrastBelize = 'sapContrast';
               var classNameContrastBelizePlus = 'sapContrastPlus';
               var classNameFooterTitleSection = 'sapMLightBoxTitleSection';
               var classNameFooterTitle = 'sapMLightBoxTitle';
               var classNameFooterSubtitle = 'sapMLightBoxSubtitle';
               var classNameFooterTwoLines = 'sapMLightBoxFooterTwoLines';

               var title = oImageContent.getAggregation("_title"),
                  subtitle = oImageContent.getAggregation("_subtitle");
               oRm.write('<div');
               oRm.addClass(classNameFooter);
               oRm.addClass(classNameContrastBelize);
               oRm.addClass(classNameContrastBelizePlus);

               if (oImageContent.getSubtitle()) {
                  oRm.addClass(classNameFooterTwoLines);
               }

               oRm.writeClasses();
               oRm.write( '>');
               oRm.write('<div class="' + classNameFooterTitleSection + '">');
               if (title) {
                  oRm.renderControl(title.addStyleClass(classNameFooterTitle));
               }

               if (subtitle && subtitle.getText()) {
                  oRm.renderControl(subtitle.addStyleClass(classNameFooterSubtitle));
               }

               oRm.write('</div>');
               oRm.renderControl(oControl._getSaveButton());
               oRm.renderControl(oControl._getCloseButton());
               oRm.write('</div>');
            }
         }

      });
   });

