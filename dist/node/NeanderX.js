"use strict";

const CPU = require('./arch/CPU.js');

/**
 * Decodes a hex encoded string to a Number array.
 *
 * loosely based on code from:
 * @link https://github.com/dcodeIO/bytebuffer.js/blob/master/dist/bytebuffer.js
 *
 * @param {string} str String to decode
 * @returns {Number[]}
 */
let hexToArray = str => {
    var length,
        arr  = null,
        i    = 0,
        j    = 0;

    if (typeof str !== 'string'){
        throw TypeError("Argument must be a string");
    }

    str    = str.replace(/[^A-Fa-f0-9]/g, '');
    length = str.length;

    if (length & 1) {//% 2
        throw TypeError("String length is not a multiple of 2");
    }

    arr = new Array(length / 2);

    for (; i < length; i += 2) {
        arr[j++] = parseInt(str.substring(i, i+2), 16) | 0;
    }

    return arr;
};

class NeanderX {
    /**
     * NeaderX Constructor
     *
     * @param {Object} [opts={}]
     */
    constructor(opts){
        this.cpu = new CPU(opts || {});

        this.fileArray = null;

    }

    /**
     *
     * @param {(File|String|Null|undefined)} file
     * @param {(Function)}                   [cb]
     * @returns {NeanderX}
     */
    load(file, cb){
        cb = typeof cb === 'function'? cb : error => {
            throw error;
        };

        if(Array.isArray(file) || file instanceof ArrayBuffer){
            this.fileArray = file;

        } else if(typeof file === 'string'){
            //TODO: finish
            return this;

        }  else if(this.fileArray === null){
            setImmediate(() => cb(new TypeError("Invalid File")));
            return this;
        }

        setImmediate(() => {
            let error;

            try{
                this.cpu.reset(this.fileArray);

            }catch(err){error = err}

            cb(error);
        });
        return this;
    }
}
module.exports = NeanderX;