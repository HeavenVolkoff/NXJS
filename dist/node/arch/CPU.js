"use strict";

const Clock = require('./Clock.js');

class UnknownInstruction extends Error{
    constructor(opCode){
        super(`Unexpected Instruction with code: ${opCode.toString(16)}`);
        this.opCode = opCode;
    }
}

class CPU {
    constructor(opts) {
        /**
         * Clock frequency in Kilohertz
         * @type {number}
         */
        this.kHz = opts.kHz || 1000;

        /**
         * Array of Inputs Devices
         * @type {Function[]}
         */
        this.input = Array.isArray(opts.input)? opts.input.map(input => {
            if(typeof input === "function"){
                return input;

            } else if(typeof input === "object" && typeof input.read === "function"){
                return () => {
                    return input.read();
                };
            }

            throw new TypeError("Invalid Input: no read function declared");
        }) : [];

        /**
         * Array of Output Devices
         * @type {Function[]}
         */
        this.output = Array.isArray(opts.output)? opts.output.map(output => {
            if(typeof output === "function"){
                return output;

            } else if(typeof output === "object" && typeof output.write === "function"){
                let write = output.write;

                return () => {
                    return write.call(output);
                };
            }

            throw new TypeError("Invalid Output: no write function declared");
        }) : [];

        /**
         * OpCodes names (Mapped to each binary value)
         * @type {String[]}
         */
        this.opCodes = ["nop", "sta", "lda", "add", "or", "and", "not", "sub", "jmp", "jn", "jz", "jnz", "in", "out", "ldi", "hlt"];

        /**
         * Instance of Clock
         * @type {Object}
         */
        this.clock = Clock(this.kHz, this.tick, this);

        /**
         * Buffer (Holds all memory and registers)
         * @type {ArrayBuffer}
         */
        let buffer = new ArrayBuffer(259);

        /**
         * 8-bit Memory
         * @type {Uint8Array}
         */
        this.memory = new Uint8Array(buffer, 0, 255);

        /**
         * Accumulator Register
         * @type {Uint8Array}
         */
        this.acc = new Uint8Array(buffer, 255, 1);

        /**
         * Program Counter
         * @type {Uint8Array}
         */
        this.pc = new Uint8Array(buffer, 256, 1);

        /**
         * Flags Registers
         * [0] => Negative
         * [1] => Zero
         * @type {Uint8Array}
         */
        this.flags = new Uint8Array(buffer, 257, 2);

        /**
         * Debug Function
         *
         * @type {Function|null}
         */
        let debug  = opts.debug;
        this.debug = typeof debug === 'function'? (synchronous) => {
            synchronous = typeof synchronous === 'boolean'? synchronous : false;

            debug(this);

            if(!(this.clock.isHalted() || synchronous)){
                setTimeout(this.debug, 16.666666666666668);
            }
        } : null;
    }

    /**
     * Reset CPU with specified machine code binary
     *
     * @param {(Array|ArrayBuffer)} [fileArray] - Machine code binary source fileArray
     * @throws {TypeError}                      - Will throw if fileArray is not an Array or TypedArray
     * @throws {RangeError}                     - Will throw if fileArray size is bigger than memory (255 Bytes)
     */
    reset(fileArray){
        //Reset Memory
        this.memory.fill(0);

        //Reset Registers
        this.acc.fill(0);
        this.flags.fill(0);

        //Reset Program Counter
        this.pc.fill(0);

        //Reset Clock
        this.clock.stop();

        //fill memory with File if available
        if(!(typeof fileArray === "undefined" || fileArray === null)){
            this.memory.set(fileArray);
        }
    }

    /**
     * Start CPU operation (Start Clock)
     */
    start(){
        //Start Debug function Loop
        if(this.debug){
            setTimeout(this.debug, 16.666666666666668);
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
     * Step-by-step execution
     */
    step(){
        this.tick();
        if(this.debug){
            this.debug(true);
        }
    }

    /**
     * CPU Main Tick
     */
    tick(){
        let // Signed Int32
            pc  = this.pc[0] | 0, //Get PC register
            arg = 0,              //Argument (Only used on 2 bytes instructions)

            //Unsigned Int32
            code        = this.memory[pc] >>> 0, //Get OpCode
            instruction = code >>> 4;            //Get Instruction code (NeanderX Instructions only have 4 bits)


        /* ============== One Byte Instructions ============== */
        switch (instruction | 0) {
            case 0: //NOP
                break;

            case 6: //NOT
                //Code is a placeholder for Acc here
                code = this.acc[0] ^ 255 >>> 0;
                this.acc[0]   = code;
                this.flags[0] = (code & 255) >>> 7;
                this.flags[1] = (code & 255) === 0 & 1;
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
                        this.acc[0]   = code;
                        this.flags[0] = (code & 255) >>> 7;
                        this.flags[1] = (code & 255) === 0 & 1;
                        break;

                    case 3: //ADD
                        //Code is a placeholder for Acc here
                        code = this.acc[0] + this.memory[arg | 0] >>> 0;
                        this.acc[0]   = code;
                        this.flags[0] = (code & 255) >>> 7;
                        this.flags[1] = (code & 255) === 0 & 1;
                        break;

                    case 4: //OR
                        //Code is a placeholder for Acc here
                        code = this.acc[0] | this.memory[arg | 0] >>> 0;
                        this.acc[0]   = code;
                        this.flags[0] = (code & 255) >>> 7;
                        this.flags[1] = (code & 255) === 0 & 1;
                        break;

                    case 5: //AND
                        //Code is a placeholder for Acc here
                        code = this.acc[0] & this.memory[arg | 0] >>> 0;
                        this.acc[0]   = code;
                        this.flags[0] = (code & 255) >>> 7;
                        this.flags[1] = (code & 255) === 0 & 1;
                        break;

                    case 7: //SUB
                        //Arg is a placeholder for Acc here
                        arg = this.acc[0] - this.memory[arg | 0] | 0;
                        this.acc[0]   = arg;
                        this.flags[0] = (arg & 255) >>> 7;
                        this.flags[1] = (arg & 255) === 0 & 1;
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
                        this.acc[0] = this.input[arg]() | 0;
                        break;

                    case 13: //OUT
                        this.output[arg](this.acc[0] >>> 0);
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
module.exports = CPU;