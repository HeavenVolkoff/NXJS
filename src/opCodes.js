/**
 * This is the set of NeanderX's instructions detailing each's binary code and additional characterises
 *
 * @type {{NOP: {code: number, bytes: number}, STA: {code: number, bytes: number}, LDA: {code: number, bytes: number}, ADD: {code: number, bytes: number}, OR: {code: number, bytes: number}, AND: {code: number, bytes: number}, NOT: {code: number, bytes: number}, SUB: {code: number, bytes: number}, JMP: {code: number, bytes: number}, JN: {code: number, bytes: number}, JZ: {code: number, bytes: number}, JNZ: {code: number, bytes: number}, IN: {code: number, bytes: number, immediate: boolean}, OUT: {code: number, bytes: number, immediate: boolean}, LDI: {code: number, bytes: number, immediate: boolean}, HLT: {code: number, bytes: number}}}
 */
module.exports = {
    NOP: {
        code: 0x0
    },
    STA: {
        code: 0x1,
        hasArgument: true
    },
    LDA: {
        code: 0x2,
        hasArgument: true
    },
    ADD: {
        code: 0x3,
        hasArgument: true
    },
    OR: {
        code: 0x4,
        hasArgument: true
    },
    AND: {
        code: 0x5,
        hasArgument: true
    },
    NOT: {
        code: 0x6
    },
    SUB: {
        code: 0x7,
        hasArgument: true
    },
    JMP: {
        code: 0x8,
        hasArgument: true
    },
    JN: {
        code: 0x9,
        hasArgument: true
    },
    JZ: {
        code: 0xA,
        hasArgument: true
    },
    JNZ: {
        code: 0xB,
        hasArgument: true
    },
    IN: {
        code: 0xC,
        hasArgument: true,
        onlyImmediate: true
    },
    OUT: {
        code: 0xD,
        hasArgument: true,
        onlyImmediate: true
    },
    LDI: {
        code: 0xE,
        hasArgument: true,
        onlyImmediate: true
    },
    HLT: {
        code: 0xF,
        hasArgument: true
    }
};