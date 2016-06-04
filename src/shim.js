var MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER || Math.pow(2, 53) - 1;

function pad(str, targetLength, padString){
    var toFillLength = 0,
        remainingCodeUnits = 0;

    targetLength = targetLength < MAX_SAFE_INTEGER? targetLength : MAX_SAFE_INTEGER;
    padString = typeof padString === 'undefined'? '' : String(padString);

    if (padString === '') {
        padString = ' ';
    }

    if (targetLength <= str.length) {
        return '';
    }

    toFillLength = targetLength - str.length;

    while (padString.length < toFillLength) {
        remainingCodeUnits = toFillLength - padString.length;
        padString += padString.length > remainingCodeUnits? padString.slice(0, remainingCodeUnits) : padString;
    }

    return (padString.length > toFillLength? padString.slice(0, toFillLength) : padString)
}

exports.padStart = typeof String.prototype.padStart === 'function'? String.prototype.padStart : function padStart(targetLength, padString) {
    return pad(this, targetLength, padString) + this;
};

exports.padEnd = typeof String.prototype.padEnd === 'function'? String.prototype.padEnd : function padEnd(targetLength, padString) {
    return this + pad(this, targetLength, padString);
};