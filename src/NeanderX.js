/*? include("../meta/Meta.js");
if(NODE){

*/
"use strict";

const CPU = require(/*? Meta.require("CPU.js")*/);
/*?

 }else if(WEB){
    // ### Web Environment ###
    // All "node-modules" libs should be required on wrap-web.js.
    // Window object should be validated on wrap-web.js and available to use here

    include('./arch/CPU.js');
 }
*/

/**
 * Decodes a hex encoded string to a Number array.
 * @link https://github.com/dcodeIO/bytebuffer.js/blob/master/dist/bytebuffer.js
 *
 * @param {string} str String to decode
 * @returns {Number[]}
 */
let hexToArray = str => {
    if (typeof str !== 'string')
        throw TypeError("Illegal str: Not a string");
    if (str.length % 2 !== 0)
        throw TypeError("Illegal str: Length not a multiple of 2");

    let length = str.length,
        arr = new Array(length / 2),
        temp;

    for (var i=0, j=0; i<length; i+=2) {
        temp = parseInt(str.substring(i, i+2), 16) | 0;
        if (!isFinite(temp) || temp < 0 || temp > 255)
            throw TypeError("Illegal str: Contains non-hex characters");

        arr[j++] = temp;
    }

    return arr;
};

class NeanderX {
    constructor(opts){
        opts = opts || {};
        this.cpu = new CPU(opts);

        this.cpu.init(hexToArray(opts.hex));
    }
}
/*? if (NODE)*/
module.exports = NeanderX;