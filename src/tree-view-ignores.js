const main = require("./main.js");

module.exports = {
  activate: () => {
    main.addUI();
    main.scanForIgnores();
  },

  deactivate: () => {
    main.deactivate();
  },

  consumeTreeView: (treeView) => {
    main.consumeTreeView(treeView);
  }
};
