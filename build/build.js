"use strict";

const path = require('path');
const fs = require('fs');

function copyFile(source, target, cb) {
    var cbCalled = false;

    var rd = fs.createReadStream(source);
    rd.on("error", function(err) {
        done(err);
    });
    var wr = fs.createWriteStream(target);
    wr.on("error", function(err) {
        done(err);
    });
    wr.on("close", function(ex) {
        done();
    });
    rd.pipe(wr);

    function done(err) {
        if (!cbCalled) {
            cb(err);
            cbCalled = true;
        }
    }
}

const chkDir = path => {
    if (!(path => {
            try {
                return fs.statSync(path).isDirectory();
            } catch (err) {
                return false;
            }
        })(path)) {
        console.log(`Creating Directory ${path}`);
        fs.mkdirSync(path);
    }
};

const Dirs = {
    root: fs.realpathSync(path.join(require.resolve("~"), ".."))
};
Dirs.jsLib         = path.join(Dirs.root, 'js', 'lib');
Dirs.cssLib        = path.join(Dirs.root, 'css', 'lib');
Dirs.node_modules  = path.join(Dirs.root, 'node_modules');

chkDir(Dirs.jsLib);
chkDir(Dirs.cssLib);

const Assets = ((dir) => {
    let level = 0;
    let mainModule = "";

    let walkSync = (dir, fileList) => {
        let files = fs.readdirSync(dir);
        fileList  = fileList || new Map();

        files.forEach(file => {
            if(file === "~") return;
            let filePath = path.join(dir, file);

            if (fs.statSync(filePath).isDirectory()) {
                if(!level){
                    mainModule = file;
                }

                level++;
                walkSync(filePath, fileList);
                level--;

            }else {
                fileList.set((level > 0? mainModule + '#' : '') + (level > 1? path.basename(dir) + '#' : '') + file, path.join(dir, file));
            }
        });

        return fileList;
    };

    let assets = walkSync(dir);

    return file => {
        return assets.get(file);
    }
})(Dirs.node_modules);

const files = require('./files.json');

files.js.forEach((file) => {
    file = Assets(file);
    copyFile(file, path.join(Dirs.jsLib, path.basename(file)), (err) => {if(err) console.error(err)});
});

files.css.forEach((file) => {
    file = Assets(file);
    copyFile(file, path.join(Dirs.cssLib, path.basename(file)), (err) => {if(err) console.error(err)});
});