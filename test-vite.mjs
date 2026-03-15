import { build } from "vite";
import fs from "fs";

fs.writeFileSync("test-app.js", "console.log(process.env.API_KEY);");

build({
  root: process.cwd(),
  build: {
    lib: { entry: "test-app.js", formats: ["es"] },
    write: false
  },
  define: {
    "process.env.API_KEY": JSON.stringify(undefined)
  }
}).then(res => {
  console.log("Output:", res[0].output[0].code);
});
