//?...
Macro.isNumber = num => {
    return macro.pushInstruction(
        `typeof(${num}) === "number"`
    );
};

Macro.isValidNumber = num => {
    return Macro.isNumber(num).pushInstruction('&&', [
        `!Number.isNaN(${num})`,
        `Number.isFinite(${num})`
    ]);
};

Macro.isFloat = num => {
    return Macro.isValidNumber(num).pushInstruction('&&', `${num} % 1 !== 0`);
};

Macro.isInteger = num => {
    return macro.pushInstruction(`Number.isInteger(${num})`);
};
//?.