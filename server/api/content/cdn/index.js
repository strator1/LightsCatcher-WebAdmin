import fs from "fs";
import archiver from "archiver";

import {Router} from "express";
import * as admin from "firebase-admin";
import {app} from "../../../index";

function copyFile(source, target) {
   return new Promise(function(resolve, reject) {
      var rd = fs.createReadStream(source);
      rd.on('error', rejectCleanup);
      var wr = fs.createWriteStream(target);
      wr.on('error', rejectCleanup);
      function rejectCleanup(err) {
         rd.destroy();
         wr.end();
         reject(err);
      }
      wr.on('finish', resolve);
      rd.pipe(wr);
   });
}

export default () => {
   let cdn = Router();

   // Optional Middleware
   cdn.use((req, res, next) => {
      // Pass something through middleware
      req.hello = "Hello user middleware";
      next();
   });

   // GET

   cdn.get("/label", (req, res) => {
      var promises = [];
      var appTempDir = app.get("tempDirectory");

      if (!fs.existsSync(appTempDir + "/lights_images")) {
         res.status(500).json({success: false, data: [], msg: "No lights_images directory found in temp."});
         return;
      }

      admin.database().ref("lights/v1_0").once("value").then(snapshot => {
         var output = [];
         var tempDir = appTempDir + "/" + new Date().getTime().toString();

         var redDir = tempDir + "/red";
         var greenDir = tempDir + "/green";
         var noDir = tempDir + "/no";


         fs.mkdirSync(tempDir);

         fs.mkdirSync(redDir);
         fs.mkdirSync(greenDir);
         fs.mkdirSync(noDir);

         var snapshotVal = snapshot.val();
         for (var key in snapshotVal) {
            var val = snapshotVal[key];
            val.key = key;
            var downloadDir = noDir;

            if (val.hasOwnProperty("approved") && val.approved) {
               if (val.hasOwnProperty("lightPositions")) {
                  var filtered = val.lightPositions.filter(function(lp) {
                     if (typeof lp.isMostRelevant === "boolean" && lp.isMostRelevant) {
                        return true;
                     } else if (lp.isMostRelevant == 0) {
                        return true;
                     }
                  });

                  if (filtered.length > 0) {
                     var light = filtered[0];

                     if (light.phase === 0) {
                        downloadDir = redDir;
                     } else {
                        downloadDir = greenDir;
                     }
                  }

               } else {
                  downloadDir = noDir;
               }

               output.push(val);
               promises.push(copyFile(appTempDir + "/lights_images/" + key, downloadDir + "/" + key));
            }

         }

         Promise.all(promises.map(p => p.catch(e => e))).then(() => {
            console.log("success");
            var dest = appTempDir + '/example.zip';
            var outputStream = fs.createWriteStream(dest);
            var archive = archiver('zip', {
               store: true // Sets the compression method to STORE.
            });

            // listen for all archive data to be written
            outputStream.on('close', function() {
               console.log(archive.pointer() + ' total bytes');

               outputStream.close();
               res.status(200).json({success: true, data: output});
            });

            // good practice to catch this error explicitly
            archive.on('error', function(err) {
               fs.unlink(dest);
               res.status(500).json({success: false, data: [], msg: err});
            });

            // pipe archive data to the file
            archive.pipe(outputStream);

            // append files from a directory
            archive.directory(tempDir + "/", 'temp/');

            // finalize the archive (ie we are done appending files but streams have to finish yet)
            archive.finalize();

         }).catch(e => console.log(e));

         output.reverse();

      }).catch(error => {
         res.status(500).json({success: false, data: [], msg: error});
      });
   });

   return cdn;
}

