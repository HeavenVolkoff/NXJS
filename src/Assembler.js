const opCodes   = require('./opCodes');
const util      = require('./util');

const validNeanderNumber = util.validNeanderNumber;
const AssemblerError     = util.AssemblerError;

class Assembler{
    constructor(str){
        if(typeof str !== 'string'){
            throw new TypeError("Argument must be a string");
        }

        this.instructions  = [];
        this.memoryIndex   = 0;
        this.memory        = new Uint8Array(255);
        this.labels        = new Map();
        this.code          = [];
        this.map           = [];

        const spaceRegexExp = util.regExps.spaceRegexExp;
        const opCodeRegex   = util.regExps.opCodeRegex;

        let i = 0;

        while(i < str.length){
            let isComment = false;
            let snippet   = '';
            let j         = i;

            do{
                if(isComment){
                    isComment = str[j] !== '\n';

                }else if(spaceRegexExp.test(str[j])){
                    j++;
                    break;

                }else {
                    snippet += str[j];
                }

                j++;
            }while(j < str.length);

            i = j;

            if(snippet){
                if(opCodeRegex.test(snippet)){
                    this.instructions.push(this.code.push(snippet.toUpperCase()) - 1);
                    
                }else{
                    this.code.push(snippet);
                }

                this.map.push([i - snippet.length, snippet.length]);
            }
        }

        if(this.instructions.length <= 0){
            throw new AssemblerError("EMPTY_CODE", NaN);
        }

        //TODO: Loop through instructions array decoding and writing memory
    }

    genErrorStack(line){
        //TODO
    }
    
    EQU(index) {
        let before = index - 1;
        let after  = index + 1;

        let label = this.code[before];
        let value = this.code[after];
        let temp;

        if(!util.regExps.validLabelNameRegExp.test(label)){
            throw new AssemblerError('INVALID_LABEL_NAME', this.genErrorStack(before));
        }

        //TODO: throw Warning in case value is equal to label (redundancy)
        value = typeof (temp = this.labels.get(value)) === 'undefined'? +value : +temp;

        if(!validNeanderNumber(value)){
            throw new AssemblerError('INVALID_LABEL_VALUE', this.genErrorStack(after));
        }

        this.labels.set(label, value);

        while((index = this.code.indexOf(label, after)) !== -1){
            if(this.code[index + 1] === 'EQU'){
                break;
            }

            this.code[index] = value;
            after = index;
        }
    }
}

module.exports = Assembler;