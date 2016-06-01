"use strict";

const fs         = require("fs");
const path       = require("path");
const util       = require("util");
const metaUtil   = require("./util");
const MetaScript = require("metascript");

const pkg = require(path.join(metaUtil.Dirs.root, "package.json"));

let scope = ((scope) => {
    scope = scope || {};

    return (prop, val) => {
        if(!prop && !val){
            delete scope.__scope;
            return Object.assign({__scope: scope}, scope);

        }else if(typeof prop === "object"){
            Object.assign(scope, prop);
        }

        scope[prop] = val;
    }
})(
    {
        VERSION: pkg.version
    }
);

let filename = "NeanderX.js";
let filePath;
let dist;

//Node Version
filePath = metaUtil.Assets("NeanderX.js");
scope('NODE', true);
scope('WEB', false);
scope("__distDir", dist = path.join(metaUtil.Dirs.dist, 'node'));
scope("__originDir", path.dirname(filePath));
metaUtil.chkDir(dist);

console.log("Building NeanderX Node...");

fs.writeFileSync(
    path.join(dist, filename),
    MetaScript.transform(
        fs.readFileSync(filePath),
        filePath,
        scope()
    )
);

//Web Version
filePath = metaUtil.Assets("wrap-web.js");
scope('NODE', false);
scope('WEB', true);
scope("__distDir", dist = path.join(metaUtil.Dirs.dist, 'web'));
scope("__originDir", path.dirname(filePath));
metaUtil.chkDir(dist);

console.log("Building NeanderX Web...");

let webVersion = MetaScript.transform(
    fs.readFileSync(filePath),
    filePath,
    scope()
);

fs.writeFileSync(
    path.join(dist, filename),
    webVersion
);

let index = process.argv.indexOf('--gh-pages', 2);
if(index !== -1 && process.argv.length > index){
    let folder = process.argv[index + 1];
    console.log("Copying Web version to gh-pages folder: " + folder);

    dist = path.join(metaUtil.Dirs.root, folder);
    metaUtil.chkDir(dist);

    fs.writeFileSync(
        path.join(dist, filename),
        webVersion
    );
}

console.log("Done");
