const fs = require("fs");
const parseIgnore = require("./parse-ignore.js");
const { minimatch } = require("minimatch");
const path = require("path");

class Ignore {
  constructor() {
    this.active = false;
    this.file;
    this.paths;
  }

  enable(path) {
    if (fs.existsSync(path)) {
      // The file has been found
      this.file = fs.readFileSync(path);
      this.active = true;
      this.findPaths();
    }
  }

  shouldIgnore(item) {
    if (!this.active) { return false; }
    // This takes the path of a single item, and checks if it's within it's paths.
    for (const p of this.paths) {
      if (minimatch(item, p)) {
        return true;
      }
    }
    return false;
  }

}

class GitIgnore extends Ignore {
  constructor() {
    super();
  }

  findPaths() {
    this.paths = parseIgnore(this.file);
  }
}

class GCloudIgnore extends Ignore {
  constructor() {
    super();
  }

  findPaths() {
    // Now we should be able to use `this.file` to extract every path we care about.
    this.paths = parseIgnore(this.file, {
      beforeLine: (line, lines) => {
        if (line.startsWith("#!include:")) {
          let resource = line.replace("#!include:", "");
          let otherIgnore;
          if (fs.existsSync(resource)) {
            otherIgnore = fs.readFileSync(path.join(atom.project.getPaths()[0], resource), { encoding: "utf8" });
          }

          if (typeof otherIgnore === "string") {
            // So now we have a .gitignore we want to include into our gcloudignore
            // So we will parse the gitignore then return the array
            return parseIgnore(otherIgnore);
          } else {
            // We couldn't find the gcloudignore includes, lets just return
            return false;
          }
        } else {
          return;
        }
      }
    });
  }
}

module.exports = {
  Ignore,
  GitIgnore,
  GCloudIgnore,
};
