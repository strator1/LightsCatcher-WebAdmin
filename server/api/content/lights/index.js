import {Router} from "express";
import * as admin from "firebase-admin";

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
            output.push(childSnapshot.val());
         });
         output.reverse();
         res.status(200).json({success: true, data: output});
      }).catch(error => {
         res.status(500).json({success: false, data: [], msg: error});
      });

   });

   return lights;
}
