import fs from "fs";
import FileStreamRotator from "file-stream-rotator";

export default class Logger {

    constructor(app, isDebug) {

        this.logDirectory = app.get("logDirectory");
        this.isDebug = isDebug;

        fs.existsSync(this.logDirectory) || fs.mkdirSync(this.logDirectory);

        this.createRotatingWriteStream();

    }

    createRotatingWriteStream() {

        // create a rotating write stream
        this.accessLogStream = FileStreamRotator.getStream({
            date_format: "YYYYMMDD",
            filename: this.logDirectory + "/access-%DATE%.log",
            frequency: "daily",
            verbose: false
        });

    }

    print(textToPrint) {

        if (this.isDebug) {
            let date = new Date().toLocaleTimeString();
            console.log("LOGGER " + date + " > " + textToPrint);
        }

    }

    getWriteStream() {
        return this.accessLogStream;
    }
}