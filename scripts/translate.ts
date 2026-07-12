import fs from "fs";
import path from "path";

const messagesDir = path.join(process.cwd(), "messages");

const source = JSON.parse(
  fs.readFileSync(
    path.join(messagesDir, "en.json"),
    "utf8",
  ),
);

console.log("English messages loaded.");
console.log(source);