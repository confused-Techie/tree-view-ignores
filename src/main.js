const { CompositeDisposable, Disposable } = require("atom");

const ignore = require("./ignore.js");
const path = require("path");

let projectPath, treeViewProject, treeView, ui, subscriptions;
let supported = {
  gitignore: new ignore.GitIgnore(),
  gcloudignore: new ignore.GCloudIgnore(),
  npmignore: new ignore.NPMIgnore()
};

function consumeTreeView(localTreeView) {

  // Lets get the root path for our project.
  if (!projectPath) {
    projectPath = atom.project.getPaths()[0];
    // TODO: I sure hope just using the first result isn't problametic, but in testing seems fine.
  }

  // Now lets get our tree view
  treeViewProject = localTreeView.entryForPath(projectPath);
  treeView = localTreeView;

  updateTree(".gitignore");
}

function cleanIgnore(paths) {
  for (item of paths) {
    let entry = treeView.entryForPath(item.path);
    entry.classList.remove("status-ignored");

    if (entry.getAttribute("is") === "tree-view-directory") {
      let children = entry.querySelectorAll(".file");
      for (child of children) {
        child.classList.remove("status-ignored");
      }
    }
  }
}

function updateTree(opt) {

  if (!treeViewProject) {
    return;
  }

  let paths = atom.project.getDirectories()[0].getEntriesSync();

  // Lets first remove all instances of ignore
  cleanIgnore(paths);

  let ignore;

  for (const ignoreType in supported) {
    if (supported[ignoreType].name === opt) {
      ignore = supported[ignoreType];
    }
  }

  if (!ignore) {
    console.log(`Unable to update tree for unknown ignore type: '${opt}'`);
    return;
  }

  for (item of paths) {
    let entry = treeView.entryForPath(item.path);
    let loc = item.path.replace(`${projectPath}${path.sep}`, "");
    if (entry.getAttribute("is") === "tree-view-directory") {
      // This would indicate we are working with a directory
      // and minimatch needs us to add the path separator to recognize
      // minimatch only uses `/` so we don't care about OS here
      loc += "/";
    }

    if (ignore.active && ignore.shouldIgnore(loc)) {
      entry.classList.add("status-ignored");

      // Now we want to make sure to ignore children too
      if (entry.getAttribute("is") === "tree-view-directory") {
        let children = entry.querySelectorAll(".file");
        for (child of children) {
          child.classList.add("status-ignored");
        }
      }
    }
  }

  return;
}

function toggled(e) {
  updateTree(e.target.value);
}

function addUI() {
  let tree = atom.workspace.paneForURI("atom://tree-view");
  let treeElement = tree.element.querySelector(".tree-view-root");

  ui = document.createElement("select");
  ui.classList.add("input-select");

  treeElement.before(ui);

  if (!subscriptions) {
    subscriptions = new CompositeDisposable();
  }

  ui.addEventListener("change", toggled);
  subscriptions.add(new Disposable(() => { ui.removeEventListener("change", toggled); }));
}

function scanForIgnores() {
  if (!projectPath) {
    projectPath = atom.project.getPaths()[0];
  }

  for (const ignoreType in supported) {
    let ignore = supported[ignoreType];
    ignore.enable(path.join(projectPath, ignore.name));

    if (ignore.active) {
      let ele = document.createElement("option");
      ele.text = ignore.name;
      ele.value = ignore.name;

      ui.appendChild(ele);
    }
  }
}

function deactivate() {
  subscriptions.dispose();
  return;
}

module.exports = {
  consumeTreeView,
  addUI,
  deactivate,
  scanForIgnores,
};
