import {Router} from "express";
import * as admin from "firebase-admin";
import {storage} from "../../../admin/storage";

function deletePhotoWithKey(key) {
   const bucket = storage.bucket("hsaampelapp.appspot.com");
   const file = bucket.file("lights_images/" + key);

   return Promise.all([
      file.delete(),
      admin.database().ref("lights/v1_0").child(key).remove()
   ]);
}

function deactivateUser(uid) {
   return Promise.all([
      admin.database().ref(`bannedUsers/${uid}`).set(true),
      admin.auth().updateUser(uid, {
         disabled: true
      })
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

      var showApproved;

      if (req.query.approved !== undefined) {
         showApproved = req.query.approved == "true" ? true : false;
      } else {
         showApproved = false;
      }

      if (req.query.user !== undefined) {
         admin.database().ref("lights/v1_0").orderByChild("user").equalTo(req.query.user).once("value").then(snapshot => {
            var output = [];
            snapshot.forEach(function(childSnapshot) {
               var val = childSnapshot.val();
               val.key = childSnapshot.getKey();
               output.push(val);
            });
            res.status(200).json({success: true, data: output});
         }).catch(error => {
            res.status(500).json({success: false, data: [], msg: error});
         });

         return;
      }

      admin.database().ref("lights/v1_0").orderByChild("createdAt").once("value").then(snapshot => {
         var output = [];
         snapshot.forEach(function(childSnapshot) {
            var val = childSnapshot.val();
            val.key = childSnapshot.getKey();

            if (showApproved) {
               if (val.hasOwnProperty("approved") && val.approved) {
                  output.push(val);
               }
            } else {
               if (!val.hasOwnProperty("approved") || !val.approved) {
                  output.push(val);
               }
            }
         });
         output.reverse();
         res.status(200).json({success: true, data: output});
      }).catch(error => {
         res.status(500).json({success: false, data: [], msg: error});
      });

   });

   //PUT
   lights.put("/positions/:id", (req, res) => {
      admin.database().ref(`lights/v1_0/${req.params.id}/lightPositions`).set(JSON.parse(req.body.positions)).then(snapshot => {
         res.status(200).json({success: true, data: snapshot});
      }).catch(error => {
         res.status(500).json({success: false, data: [], msg: "Updating lightPositions not successful"});
      });
   });

   lights.put("/:id/approve", (req, res) => {
      admin.database().ref(`lights/v1_0/${req.params.id}`).update({approved: true}).then(snapshot => {
         res.status(200).json({success: true, data: snapshot});
      }).catch(error => {
         res.status(500).json({success: false, data: [], msg: "Picture approval not successful"});
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
      });
   });

   lights.delete("/:key/:uid", (req, res) => {

      if (req.params.key == "" || req.params.uid == "") {
         res.status(400).json({success: false, data:[], msg: "Please provide a key"});
         return;
      }

      deletePhotoWithKey(req.params.key).then(success => {

         deactivateUser(req.params.uid).then(success => {
            res.status(200).json({success: true, data: [], msg: "Photo deleted and User banned"});
         });

      }).catch(err => {
         res.status(500).json({success: false, data: [], msg: "Error deleting photo"});
      });
   });


   return lights;
}
