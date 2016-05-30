//?...
/* ========= Default Writes ========= */
if(NODE){
    write(`const AssertError = require('${Meta.assets('AssertError.js')}');\n`);

}else{ //WEB
    include('./../error/AssertError.js');
}

/* ============= MACROS ============= */
Macro.AssertEqual = (varName, values) => {
    let macroString = "if(";
    let counter = 0;
    let flag = false;
    let types = {};
    values = Array.isArray(values)? values : [values];

    let addToString = s => {
        macroString += (flag? '    ' : '') + s + (counter < values.length? ' &&\n' : '');
        flag = true;
    };

    values.forEach((value) => {
        let type = value === null? 'null' : typeof value;

        if(Array.isArray(types[type])){
            if(types[type].includes(value)){
                console.warn('Duplicate Value');
                counter++;
                return;
            }

            types[type].pushString(value);

        }else{
            types[type] = [value];
        }
    });

    for(let type in types){
        if(types.hasOwnProperty(type)){
            if(type === 'boolean'){
                counter += types[type].length;

                if(types[type].length > 1){
                    console.warn('Unnecessary boolean comparison');
                    continue;
                }

                let flag = types[type][0];

                addToString(`(typeof ${varName} !== 'boolean' || ${(flag? '!' : '') + varName})`);
                continue;

            }else if(type === 'undefined'){
                counter++;

                addToString(`typeof ${varName} !== 'undefined'`);
                continue;

            }else if(type === 'null'){
                counter++;

                addToString(`${varName} !== null`);
                continue;

            }else if(type === 'object' || type === 'symbol'){
                counter += types[type].length;

                console.warn("Can't Assert equality between object or symbols on macros");
                continue;
            }

            let s = `(typeof ${varName} !== '${type}' || (`;

            types[type].forEach((value, index) => {
                counter++;

                s += `${varName} !== ${value}${(index + 1) < types[type].length? ' && ' : '))'}`;
            });

            addToString(s);
        }
    }

    macroString += `){\n    throw new AssertError(\`Invalid value for variable ${varName}: \${${varName}}\`, 'EASRTEQ');\n}`;

    return macro.pushString(macroString);
};

Macro.AssertClass = (varName, _class) => {
    return macro.pushString(

`if(!(${varName} instanceof ${_class})){
    throw new AssertError("Variable ${varName} isn't of instance: ${_class}", 'EASRTCL');
}`

    );
};
//?.