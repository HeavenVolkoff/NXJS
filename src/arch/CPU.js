/*? include("../../meta/Meta.js");
 if(NODE){*/
"use strict";

const Clock = require(/*? Meta.require('Clock.js')*/);
/*? }else if(WEB){*/
const Clock = /*? include('./Clock.js')*/;
/*? }*/

class UnknownInstruction extends Error{
    constructor(opCode){
        super(`Unexpected Instruction with code: ${opCode.toString(16)}`);
        this.opCode = opCode;
    }
}

class CPU {
    constructor(opts) {
        opts = typeof opts === "object"? opts : {};

        this.kHz    = opts.kHz || 1000;

        this.input  = Array.isArray(opts.input)       ? opts.input  : [];
        this.output = Array.isArray(opts.output)      ? opts.output : [];

        this.clock = Clock(this.kHz, this.tick, this);

        this.opCodes = ["nop", "sta", "lda", "add", "or", "and", "not", "sub", "jmp", "jn", "jz", "jnz", "in", "out", "ldi", "hlt"];

        /**
         * Buffer (Holds all memory and registers)
         * @type {ArrayBuffer}
         */
        let buffer  = new ArrayBuffer(/*?= 255 + 1 + 1 + 2*/);

        /**
         * 8-bit Memory
         * @type {Uint8Array}
         */
        this.memory = new Uint8Array(buffer, 0, 255);

        /**
         * Accumulator Register
         * @type {Uint8Array}
         */
        this.acc    = new Uint8Array(buffer, 255, 1);

        /**
         * Program Counter
         * @type {Uint8Array}
         */
        this.pc     = new Uint8Array(buffer, 256, 1);

        /**
         * Flags Registers
         * [0] => Negative
         * [1] => Zero
         * @type {Uint8Array}
         */
        this.flags  = new Uint8Array(buffer, 257, 2);

        this.debug = typeof opts.debug === 'function'? () => {
            opts.debug.call(this);

            if(!this.clock.isHalted()){
                //? if(NODE){
                setTimeout(this.debug, /*?= 1000/60 */);
                //? }else if(WEB){
                requestAnimationFrame(this.debug);
                //? }
            }
        } : null;
    }

    /**
     * Reset CPU
     */
    reset(){
        //Reset Memory
        this.memory.fill(0);

        //Reset Registers
        this.acc.fill(0);
        this.flags.fill(0);

        //Reset Program Counter
        this.pc.fill(0);

        //Reset Clock
        this.clock.stop();
    }

    /**
     * Initialize CPU with specified machine code binary
     *
     * @param {(Array|TypedArray)} file - Machine code binary source file
     * @throws {TypeError}              - Will throw if file is not an Array or TypedArray
     * @throws {RangeError}             - Will throw if file size is bigger than memory (255 Bytes)
     */
    init(file){
        this.reset();

        //Copy file contents to memory
        this.memory.set(file);

        //Start Debug function Loop
        if(this.debug){
            //? if(NODE){
            setTimeout(this.debug, /*?= 1000/60 */);
            //? }else if(WEB){
            requestAnimationFrame(this.debug);
            //? }
        }

        //Start clock loop
        this.clock.start();
    }

    /**
     * Halt CPU operations (Pause Clock loop)
     */
    halt(){
        this.clock.pause();
    }

    /**
     * Resume CPU operations (Resume Clock loop)
     */
    resume(){
        this.clock.start();
    }

    /**
     * CPU Main Tick
     */
    tick(){
        "use asm";
        let // Signed Int32
            pc  = this.pc[0] | 0, //Get PC register
            arg = 0,              //Argument (Only used on 2 bytes instructions)

            //Unsigned Int32
            code        = this.memory[pc] >>> 0, //Get OpCode
            instruction = code >>> 4;            //Get Instruction code (NeanderX Instructions only have 4 bits)

        //?...
            Macro.updateAcc = (varName) => macro.pushString(
                'this.acc[0]   = ' + varName + ';\n' +
                'this.flags[0] = (' + varName + ' & 255) >>> 7;\n' +
                'this.flags[1] = (' + varName + ' & 255) === 0 & 1;'
            );
        //?.

        /* ============== One Byte Instructions ============== */
        switch (instruction | 0) {
            case 0: //NOP
                break;

            case 6: //NOT
                //Code is a placeholder for Acc here
                code = this.acc[0] ^ 255 >>> 0;
                /*? Macro.updateAcc('code').$(IN|LB); */
                break;

            case 15: //HALT
                this.halt();
                return; //TODO: Check if halt really doesn't increment the PC

            default:
                arg = this.memory[pc + 1] | 0; //Get Argument

                if(code & 1){ //Check instruction addressing mode
                    arg = this.memory[arg] | 0;
                }

                /* ============== Two Bytes Instructions ============= */
                switch (instruction | 0) {
                    case 1: //STA
                        this.memory[arg | 0] = this.acc[0] >>> 0;
                        break;

                    case 2: //LDA
                        //Code is a placeholder for Acc here
                        code = this.memory[arg | 0] >>> 0;
                        /*? Macro.updateAcc('code').$(IN|LB); */
                        break;

                    case 3: //ADD
                        //Code is a placeholder for Acc here
                        code = this.acc[0] + this.memory[arg | 0] >>> 0;
                        /*? Macro.updateAcc('code').$(IN|LB); */
                        break;

                    case 4: //OR
                        //Code is a placeholder for Acc here
                        code = this.acc[0] | this.memory[arg | 0] >>> 0;
                        /*? Macro.updateAcc('code').$(IN|LB); */
                        break;

                    case 5: //AND
                        //Code is a placeholder for Acc here
                        code = this.acc[0] & this.memory[arg | 0] >>> 0;
                        /*? Macro.updateAcc('code').$(IN|LB); */
                        break;

                    case 7: //SUB
                        //Arg is a placeholder for Acc here
                        arg = this.acc[0] - this.memory[arg | 0] | 0;
                        /*? Macro.updateAcc('arg').$(IN|LB); */
                        break;

                    case 8: //JMP
                        this.pc[0] = arg >>> 0;
                        return;

                    case 9: //JN
                        if(this.flags[0] >>> 0){
                            this.pc[0] = arg >>> 0;
                            return;
                        }
                        break;

                    case 10: //JZ
                        if(this.flags[1] >>> 0){
                            this.pc[0] = arg >>> 0;
                            return;
                        }
                        break;

                    case 11: //JNZ
                        if(!(this.flags[1] >>> 0)){
                            this.pc[0] = arg >>> 0;
                            return;
                        }
                        break;

                    case 12: //IN
                        this.acc[0] = this.input[arg].read() | 0;
                        break;

                    case 13: //OUT
                        this.output[arg].write(this.acc[0] >>> 0);
                        break;

                    case 14: //LDI
                        this.acc[0] = arg >>> 0;
                        break;

                    default:
                        this.clock.pause();
                        throw new UnknownInstruction(instruction);
                }

                this.pc[0] = pc + 2;
                return;
        }

        this.pc[0] = pc + 1;
        return;
    }
}
/*? if (NODE)*/
module.exports = CPU;