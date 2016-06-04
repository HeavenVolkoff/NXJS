const format = require('chalk');

const messages = require('./messages.json');
const opCodes  = require('./opCodes');
const regExps  = require('./regExps');
const shim     = require('./shim');

const Warning = 0;
const Error   = 1;

class Assembler{
    /**
     * @param {(Object|String)} opts
     *     @param {String}  [opts.asm]
     *     @param {Boolean} [opts.throwOnWarning]
     */
    constructor(opts){
        opts = opts || {};

        this.throwOnWarning =  Boolean(opts.throwOnWarning);
        this.instructions   = [];
        this.memoryIndex    = 0;
        this.warnings       = 0;
        this.memory         = new Uint8Array(255);
        this.labels         = new Map();
        this.errors         = 0;
        this.code           = [];
        this.asm            = typeof opts === 'string'? opts : String(opts.asm);
        this.map            = [];

        const spaceRegexExp = regExps.space;
        const opCodeRegex   = regExps.opCode;

        let i = 0;

        while(i < this.asm.length){
            let isComment = false;
            let snippet   = '';
            let j         = i;

            do{
                if(isComment){
                    isComment = this.asm[j] !== '\n';

                }else if(spaceRegexExp.test(this.asm[j])){
                    j++;
                    break;

                }else if(this.asm[j] === ';'){
                    isComment = true;

                }else {
                    snippet += this.asm[j];
                }

                j++;
            }while(j < this.asm.length);

            i = j;

            if(snippet){
                if(opCodeRegex.test(snippet)){
                    this.instructions.push(this.code.push(snippet.toUpperCase()) - 1);
                    
                }else{
                    this.code.push(snippet);
                }

                this.map.push({
                    index: i - snippet.length,
                    length: snippet.length
                });
            }
        }

        if(this.instructions.length <= 0){
            throw new AssemblerError("EMPTY_CODE", NaN);
        }

        //TODO: Loop through instructions array decoding and writing memory
    }

    throw(type, code, index){
        const lineBreakRegExp  = regExps.lineBreak;
        const instruction      = this.map[index];
        
        let lineStartIndex = 0,
            codeTillError  = this.asm.substring(0, instruction.index),
            lineEndIndex   = 0,
            column         = 0,
            line           = 0;

        //Reset RegExp
        lineBreakRegExp.lastIndex = 0;

        while(lineBreakRegExp.exec(codeTillError) !== null) {
            lineStartIndex = lineBreakRegExp.lastIndex;
            line++;
        }

        lineBreakRegExp.lastIndex = lineStartIndex;
        lineBreakRegExp.exec(this.asm);

        lineEndIndex = lineBreakRegExp.lastIndex - 1;
        column       = instruction.index - lineStartIndex;

        let errorMessage = '';
        let pointerLine  = ' '.repeat(instruction.index - lineStartIndex - 1) + '^'.repeat(instruction.length);
        let minLength    = 0;
        let errorLine    = this.asm.substring(lineStartIndex, lineEndIndex);
        switch(type){
            case Warning:
                this.warnings++;

                errorMessage = `Warning:${line}:${column}: ${messages[code] || code}`;
                minLength    = errorMessage.length;
                errorMessage = format.bold.yellow(errorMessage);
                break;

            case Error:
                this.errors++;

                errorMessage = `Error:${line}:${column}: ${messages[code] || code}`;
                minLength    = errorMessage.length;
                errorMessage = format.bold.red(errorMessage);
                break;
        }

        minLength = minLength > errorLine.length? minLength : errorLine.length;

        console.log(format.bgBlack(
            shim.padEnd.call(errorMessage, minLength) + '\n' +
            shim.padEnd.call(format.white(errorLine), minLength) + '\n' +
            shim.padEnd.call(format.green(pointerLine), minLength)
        ));
    }
    
    EQU(index) {
        let before = index - 1;
        let after  = index + 1;

        let label = this.code[before];
        let value = this.code[after];
        let temp;

        if(!regExps.validLabelName.test(label)){
            return this.throw('INVALID_LABEL_NAME', before);
        }

        //TODO: throw Warning in case value is equal to label (redundancy)
        value = typeof (temp = this.labels.get(value)) === 'undefined'? +value : +temp;

        value = this.validateNumber(value, after);

        this.labels.set(label, value);

        while((index = this.code.indexOf(label, after)) !== -1){
            if(this.code[index + 1] === 'EQU'){
                break;
            }

            this.code[index] = value;
            after = index;
        }
    }

    validateNumber(num, errorIndex){
        if(!Number.isInteger){

        }

        if(Number.isInteger(num)){
            if(num < 0 || num > 255){
                this.throw("NUMBER_EXCEED_RANGE");
            }

            return true;
        }

        return num & 255;
    };
}

//##Test Case
let ass = new Assembler(';---------------------------------------------------\n; Programa: 6 -  Encontrar o menor elemento em um vetor de 10 elementos de 8 bits cada. Coloque os valores iniciais do vetor com uso das diretivas do montador. (1,0 ponto)\n; Autor: Raphael Almeida, Guilherme Freire e Vitor Augusto\n; Data: 26/04/2016\n;---------------------------------------------------\n\nMIN        EQU  197\nLOOP       EQU  198\nADDR       EQU  199\nV1         EQU  200\n\nORG  0 ; Inicializa o contador, LOOP, com o valor 10, O endereço inicial do vetor, V1, e aponta ADDR para o inicio do vetor.\n\n           LDI  10\n           STA  LOOP\n\n           LDI  200\n           STA  ADDR\n\n           LDI  10\n           STA  V1\n\n           JMP  30\n\n\nORG  30 ; Faz um loop decrementando LOOP (contador). Calcula o endereço da proxima posição do vetor em ADDR e armazena o valor da contagem (regressiva) nesse endereço. Preenchendo, assim, o vetor.\n\n           LDI  255\n           ADD  LOOP\n\n           JZ   90\n\n           STA  LOOP\n\n           LDI  1\n           ADD  ADDR\n           STA  ADDR\n\n           LDA  LOOP\n           STA  @ADDR\n\n           JMP  30                      \n\n\nORG 90 ; Reseta o contador, LOOP, com o valor 10, Aponta ADDR para o inicio do vetor e coloca o primeiro valor do vetor em MIN.\n\n           LDI  10\n           STA  LOOP\n\n           LDI  200\n           STA  ADDR\n\n           LDA  @ADDR\n           STA  MIN\n\n           JMP  120\n\n\nORG 120 ; Faz um loop decrementando LOOP (contador). Calcula o endereço da proxima posição do vetor em ADDR e se o valor for menor pula para o trecho 110.\n\n           LDI  255\n           ADD  LOOP\n\n           JZ   150\n\n           STA  LOOP\n\n           LDI  1\n           ADD  ADDR\n           STA  ADDR\n\n           LDA  MIN\n           SUB  @ADDR\n           JN   120\n\n           JMP  110\n\n\nORG 110 ; Armazena o valor na posição apontada por ADDR em MIN.\n\n           LDA  @ADDR\n           STA  MIN\n\n           JMP 120\n           \n\nORG 150 ; Mostra no visor o resultado final.\n\n          LDA  MIN\n          OUT  0\n          \n          HLT');
ass.throw(Error, "TESTE", 32);

module.exports = Assembler;