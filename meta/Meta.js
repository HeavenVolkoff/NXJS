//?...
fs       = require("fs");
path     = require("path");
metaUtil = require("~/meta/util.js");

Meta = {
    //TODO: Remove wavy dependency
    //assets: file => path.join('~', path.relative(metaUtil.Dirs.root, metaUtil.Assets(file))),

    require: file => {
        let filePath         = metaUtil.Assets(file);
        let relativeFilePath = path.relative(__originDir, filePath);

        __scope.__distDir = path.dirname(path.join(__distDir, relativeFilePath));
        __scope.__originDir = path.dirname(path.join(__originDir, relativeFilePath));

        metaUtil.chkDir(__scope.__distDir);

        (function(){
            fs.writeFileSync(
                path.join(__scope.__distDir, file),
                require("metascript").transform(
                    fs.readFileSync(filePath),
                    filePath,
                    Object.assign({__scope: __scope}, __scope)
                )
            );
        })();

        //TODO-FIX: This is really bad design
        include(path.relative(__dirname, path.join(metaUtil.Dirs.root, 'meta', 'Meta.js')));

        write(`'./${relativeFilePath}'`);
    }
};

include('Macro.js');
//?.