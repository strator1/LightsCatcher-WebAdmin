import express from "express";
import bodyParser from "body-parser";
import morgan from "morgan";
import cors from "cors";
import expressValidator from "express-validator";
import opn from "opn";

import * as admin from "firebase-admin";
import ServiceAccount from "./helpers/serviceAccountKey.json";
//import AdminService from "./admin";

import config from "./helpers/config";
import Logger from "./helpers/logger";

import apiRouter from "./api";

let app = express();
let PORT = process.env.PORT || 4000;

app.set("logDirectory", __dirname + config.logDirectory);

const logger = new Logger(app, true);

// enable directory listening
console.log(__dirname + "/app");
app.use("/app", express.static(__dirname + "/app"));

app.use(cors());
// setup the logger
app.use(morgan("combined", {stream: logger.getWriteStream()}));
app.use(morgan("dev"));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({
   limit : config.bodyLimit
}));
app.use(expressValidator());

// api router
app.use("/api", apiRouter());

admin.initializeApp({
   credential: admin.credential.cert(ServiceAccount),
   databaseURL: config.firebaseAppUrl
});

app.listen(PORT, function() {
   console.log("Server running on " + PORT);
   opn("http://localhost:4000/app/");
});

/*const adminService = new AdminService();*/

export { logger, app };
