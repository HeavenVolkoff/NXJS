exports.AssemblerError = class AssemblerError extends Error{
    /**
     * Constructor
     * @param {String} code  - Error string code
     * @param {Number} index - Index of assembly code line where the error was detected, if NaN it was a critical error through the whole assembly code
     */
    constructor(code, index){
        super((Number.isNaN(index)? "Critical error" : "Compiling error") +  + " at index: " + index);
        this.code = code;
        this.index = index;
    }
};

exports.validNeanderNumber = (num) => {
    if(Number.isInteger(num)){
        if(num < 0 || num > 255){
            //TODO: throw warning
        }

        return true;
    }

    return false;
};

exports.regExps = {
    validLabelName: /^[a-zA-Z\$_][a-zA-Z0-9\$_]*$/,
    lineBreak: /\r?\n|\r/g,
    opCode: /^(NOP|STA|LDA|ADD|OR|AND|NOT|SUB|JMP|JN|JZ|JNZ|IN|OUT|LDI|HLT|ORG|EQU|END|DS|DB)$/i,
    space: /\s/
};