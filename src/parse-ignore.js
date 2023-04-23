/**
  parse-ignore.js

  A very very simple gitignore parser.
  Ignores `.gitignore` comments, and otherwise adds a file to an array.
  Once done the array of files found within the parser is returned.

  The value of this parser over the many NPM modules available is via the `opts`
  object allows an object passed with `beforeLine` a function, that will be called
  prior to any parsing internally. This allows custom parsing of any lines
  that a specific implementation requires. When returning data from the `beforeLine`
  function there's a few formats that can be returned that each have their own meaning:
    - string: Gets added to the output array of lines
    - false: A boolean false will skip this line and do nothing else
    - array: An array will be added to the entire lines object to be parsed later on
    - empty: An empty `return;` should be used when the custom function has nothing
      to do, and will allow the line to be parsed by the rest of the parser.

  An example of this:
  let paths = parseIgnore(file, {
    beforeLine: (line, lines) => {

    }
  });

    - `line`: Is the value of the current line
    - `lines`: Is the value of all lines that need to be parsed
*/

const fs = require("fs");

const split = str => String(str).split(/\r\n?|\n/);

function parse(input, opts = {}) {
  let lines = split(input);
  let output = [];

  for (line of lines) {
    let val = line.trim();

    if (typeof opts.beforeLine === "function") {
      let l = opts.beforeLine(val, lines);
      if (typeof l === "string") {
        output.push(l);
        continue;
      }
      if (typeof l === "boolean" && l === false) {
        continue;
      }
      if (Array.isArray(l)) {
        for (const item of l) {
          lines.push(item);
        }
      }
    }

    if (val.startsWith("#")) {
      continue;
    }

    if (val !== "") {
      output.push(val);
    }
  }
  return output;
}

module.exports = parse;
