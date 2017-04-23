sap.ui.define(["sap/ui/core/format/DateFormat"],
   function() {
      "use strict";
      return {
         formatTimestampToData: function(timeStamp) {
            return moment(parseInt(timeStamp)).format("MMMM Do YYYY, h:mm:ss a");
         }
      };
   });