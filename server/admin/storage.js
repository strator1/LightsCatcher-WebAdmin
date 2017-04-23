import ServiceAccount from "../helpers/serviceAccountKey.json";

const gcloud = require("google-cloud");

const storage = gcloud.storage({
   projectId: 'hsaampelapp',
   credentials: ServiceAccount
});

export { storage };
