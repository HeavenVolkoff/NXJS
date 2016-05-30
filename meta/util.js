const path = require('path');
const fs = require('fs');

let util = {
    chkDir: path => {
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
    }
};

util.Dirs = {
    root: fs.realpathSync(path.join(require.resolve("~"), ".."))
};
util.Dirs.src = path.join(util.Dirs.root, 'src');
util.Dirs.dist = path.join(util.Dirs.root, 'dist');

util.chkDir(util.Dirs.dist);

util.Assets = ((dir) => {
    let walkSync = (dir, fileList) => {
        let files = fs.readdirSync(dir);
        fileList  = fileList || new Map();

        files.forEach(file => {
            let filePath = path.join(dir, file);

            if (fs.statSync(filePath).isDirectory()) {
                walkSync(filePath, fileList);

            }else {
                fileList.set(file, path.join(dir, file));
            }
        });

        return fileList;
    };

    let assets = walkSync(dir);

    return file => {
        return assets.get(file);
    }
})(util.Dirs.src);

module.exports = util;