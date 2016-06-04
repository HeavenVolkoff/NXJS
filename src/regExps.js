module.exports = {
    validLabelName: /^[a-zA-Z\$_][a-zA-Z0-9\$_]*$/,
    lineBreak: /\r?\n|\r/g,
    opCode: /^(NOP|STA|LDA|ADD|OR|AND|NOT|SUB|JMP|JN|JZ|JNZ|IN|OUT|LDI|HLT|ORG|EQU|END|DS|DB)$/i,
    space: /\s/
};