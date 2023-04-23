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

  switch(opt) {
    case ".npmignore":
      for (item of paths) {
        let entry = treeView.entryForPath(item.path);
        let loc = item.path.replace(`${projectPath}${path.sep}`, "");
        if (entry.getAttribute("is") === "tree-view-directory") {
          loc += "/";
        }

        if (supported.npmignore.active && supported.npmignore.shouldIgnore(loc)) {
          entry.classList.add("status-ignored");

          if (entry.getAttribute("is") === "tree-view-directory") {
            let children = entry.querySelectorAll(".file");
            for (child of children) {
              child.classList.add("status-ignored");
            }
          }
        }
      }
      break;

    case ".gcloudignore":
      for (item of paths) {
        let entry = treeView.entryForPath(item.path);
        let loc = item.path.replace(`${projectPath}${path.sep}`, "");
        if (entry.getAttribute("is") === "tree-view-directory") {
          // This would indicate we are working with a directory
          // and minimatch needs us to add the path separator to recognize
          // minimatch only uses `/` so we don't care about OS here
          loc += "/";
        }

        if (supported.gcloudignore.active && supported.gcloudignore.shouldIgnore(loc)) {
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
      break;

    case ".gitignore":
      for (item of paths) {
        let entry = treeView.entryForPath(item.path);
        entry.classList.remove("status-ignored");
        let loc = item.path.replace(`${projectPath}${path.sep}`, "");
        if (entry.getAttribute("is") === "tree-view-directory") {
          loc += "/";
        }

        if (supported.gitignore.active && supported.gitignore.shouldIgnore(loc)) {
          entry.classList.add("status-ignored");

          // Then apply to all children
          if (entry.getAttribute("is") === "tree-view-directory") {
            let children = entry.querySelectorAll(".file");
            for (child of children) {
              child.classList.add("status-ignored");
            }
          }
        }
      }
      break;
    default:
      break;
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

  supported.gitignore.enable(path.join(projectPath, ".gitignore"));

  if (supported.gitignore.active) {
    let gitignore = document.createElement("option");
    gitignore.text = ".gitignore";
    gitignore.value = ".gitignore";

    ui.appendChild(gitignore);
  }

  supported.gcloudignore.enable(path.join(projectPath, ".gcloudignore"));

  if (supported.gcloudignore.active) {
    let gcloudignore = document.createElement("option");
    gcloudignore.text = ".gcloudignore";
    gcloudignore.value = ".gcloudignore";

    ui.appendChild(gcloudignore);
  }

  supported.npmignore.enable(path.join(projectPath, ".npmignore"));

  if (supported.npmignore.active) {
    let npmignore = document.createElement("option");
    npmignore.text = ".npmignore",
    npmignore.value = ".npmignore";

    ui.appendChild(npmignore);
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
