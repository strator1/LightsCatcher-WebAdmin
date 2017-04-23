import { version } from "../../package.json";
import { Router } from "express";

import lightsRouter from "./content/lights";

export default () => {
   let api = Router();

   // Lights routes ->api/lights
   api.use("/lights", lightsRouter());

   // perhaps expose some API metadata at the root
   api.get("/", function(req, res) {
      res.json({ version });
   });

   return api;
}