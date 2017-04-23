import {Router} from "express";
import * as admin from "firebase-admin";
import {storage} from "../../../admin/storage";

function deletePhotoWithKey(key) {
   const bucket = storage.bucket("hsaampelapp.appspot.com");
   const file = bucket.file("lights_images/" + key);

   return Promise.all([
      file.delete(),
      admin.database().ref("lights").child(key).remove()
   ]);
}

export default () => {
   let lights = Router();

   // Optional Middleware
   lights.use((req, res, next) => {
      // Pass something through middleware
      req.hello = "Hello user middleware";
      next();
   });

   // GET

   lights.get("/", (req, res) => {
      
      admin.database().ref("lights").orderByChild("createdAt").limitToLast(1000).once("value").then(snapshot => {
         var output = [];
         snapshot.forEach(function(childSnapshot) {
            var val = childSnapshot.val();
            val.key = childSnapshot.getKey();
            output.push(val);
         });
         output.reverse();
         res.status(200).json({success: true, data: output});
      }).catch(error => {
         res.status(500).json({success: false, data: [], msg: error});
      });

   });

   //Delete

   lights.delete("/:key", (req, res) => {

      if (req.params.key == "") {
         res.status(400).json({success: false, data:[], msg: "Please provide a key"});
         return;
      }

      deletePhotoWithKey(req.params.key).then(success => {
         res.status(200).json({success: true, data: [], msg: "Photo deleted"});
      }).catch(err => {
         res.status(500).json({success: false, data: [], msg: "Error deleting photo"});
      })
   });


   return lights;
}
