import {Router} from "express";
import * as admin from "firebase-admin";

function validateUserUpdate(req, res, next) {

   req.checkBody("email", "Please provide a eail").notEmpty();
   req.checkBody("name", "Please provide a name").notEmpty();
   req.checkBody("points", "Please provide user points").notEmpty().isInt();

   next();

}

export default () => {
   let users = Router();

   // Optional Middleware
   users.use((req, res, next) => {
      // Pass something through middleware
      req.hello = "Hello user middleware";
      next();
   });

   // GET

   users.get("/", (req, res) => {
      if (req.query.key === undefined) {
         res.status(400).json({success: false, data: [], msg: "Please provide query string 'key'"});
         return;
      }

      admin.database().ref("users")
         .orderByKey()
         .startAt(req.query.key)
         .endAt(req.query.key+"\uf8ff")
         .once("value").then(snapshot => {
         res.status(200).json({success: true, data: snapshot.val()});
      }).catch(error => {
         res.status(500).json({success: false, data: [], msg: error});
      })
   });
   users.get("/:uid", (req, res) => {
      if (req.params.uid == "") {
         res.status(400).json({success: false, data: [], msg: "Please provide a uid"});
         return;
      }

      let key = req.params.uid;

      admin.database().ref(`users/${key}`).once("value").then(snapshot => {
         res.status(200).json({success: true, data: snapshot.val()});
      }).catch(error => {
         res.status(500).json({success: false, data: [], msg: error});
      });
   });

   // PUT

   users.put("/:uid", validateUserUpdate, (req, res) => {
      let errors = req.validationErrors();

      if (errors || req.params.uid === "") {
         res.status(400).json({success: false, data: errors});
         return;
      }

      let user = {
         email: req.body.email,
         name: req.body.name,
         points: req.body.points
      };

      console.log(req.body.email);

      admin.database().ref(`users/${req.params.uid}`).set(user).then(snapshot => {
         res.status(200).json({success: true, data: snapshot});
      }).catch(error => {
         res.status(500).json({success: false, data: [], msg: "Updating user not successful"});
      });
   });

   return users;
}

