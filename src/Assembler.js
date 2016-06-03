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
        this.string        = str;
        this.code          = [];
        this.map           = [];

        const spaceRegexExp = util.regExps.space;
        const opCodeRegex   = util.regExps.opCode;

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

                }else if(str[j] === ';'){
                    isComment = true;

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

    genErrorStack(index){
        const instruction = this.map[index];
        const lineBreakRegExp  = util.regExps.lineBreak;
        
        let lineStartIndex = 0,
            lineEndIndex   = 0,
            substring      = this.string.substring(0, instruction.index),
            column         = 0,
            line           = 0;

        //Reset RegExp
        lineBreakRegExp.lastIndex = 0;

        while(lineBreakRegExp.exec(substring) !== null) {
            lineStartIndex = lineBreakRegExp.lastIndex;
            line++;
        }

        //Get end lineIndex
        lineBreakRegExp.lastIndex = lineStartIndex;
        lineBreakRegExp.exec(this.string);

        lineEndIndex = lineBreakRegExp.lastIndex - 1;
        column       = instruction.index - lineStartIndex;

        return {
            line: line,
            column: column,
            code: this.string.substring(lineStartIndex, lineEndIndex) + '\n' + ' '.repeat(instruction.index - lineStartIndex - 1) + '^'.repeat(instruction.length) + '\n'
        };
    }
    
    EQU(index) {
        let before = index - 1;
        let after  = index + 1;

        let label = this.code[before];
        let value = this.code[after];
        let temp;

        if(!util.regExps.validLabelName.test(label)){
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

//##Test Case
let ass = new Assembler(';---------------------------------------------------\n; Programa: 6 -  Encontrar o menor elemento em um vetor de 10 elementos de 8 bits cada. Coloque os valores iniciais do vetor com uso das diretivas do montador. (1,0 ponto)\n; Autor: Raphael Almeida, Guilherme Freire e Vitor Augusto\n; Data: 26/04/2016\n;---------------------------------------------------\n\nMIN        EQU  197\nLOOP       EQU  198\nADDR       EQU  199\nV1         EQU  200\n\nORG  0 ; Inicializa o contador, LOOP, com o valor 10, O endereço inicial do vetor, V1, e aponta ADDR para o inicio do vetor.\n\n           LDI  10\n           STA  LOOP\n\n           LDI  200\n           STA  ADDR\n\n           LDI  10\n           STA  V1\n\n           JMP  30\n\n\nORG  30 ; Faz um loop decrementando LOOP (contador). Calcula o endereço da proxima posição do vetor em ADDR e armazena o valor da contagem (regressiva) nesse endereço. Preenchendo, assim, o vetor.\n\n           LDI  255\n           ADD  LOOP\n\n           JZ   90\n\n           STA  LOOP\n\n           LDI  1\n           ADD  ADDR\n           STA  ADDR\n\n           LDA  LOOP\n           STA  @ADDR\n\n           JMP  30                      \n\n\nORG 90 ; Reseta o contador, LOOP, com o valor 10, Aponta ADDR para o inicio do vetor e coloca o primeiro valor do vetor em MIN.\n\n           LDI  10\n           STA  LOOP\n\n           LDI  200\n           STA  ADDR\n\n           LDA  @ADDR\n           STA  MIN\n\n           JMP  120\n\n\nORG 120 ; Faz um loop decrementando LOOP (contador). Calcula o endereço da proxima posição do vetor em ADDR e se o valor for menor pula para o trecho 110.\n\n           LDI  255\n           ADD  LOOP\n\n           JZ   150\n\n           STA  LOOP\n\n           LDI  1\n           ADD  ADDR\n           STA  ADDR\n\n           LDA  MIN\n           SUB  @ADDR\n           JN   120\n\n           JMP  110\n\n\nORG 110 ; Armazena o valor na posição apontada por ADDR em MIN.\n\n           LDA  @ADDR\n           STA  MIN\n\n           JMP 120\n           \n\nORG 150 ; Mostra no visor o resultado final.\n\n          LDA  MIN\n          OUT  0\n          \n          HLT');
console.log(ass);

module.exports = Assembler;