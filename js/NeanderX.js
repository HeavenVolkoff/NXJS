(function(global, factory) {
    Array.from = typeof Array.from === "function" ? Array.from : (arrLike) => {
        return arrLike.length === 1 ? [arrLike[0]] : Array.apply(null, arrLike);
    };

    if (typeof define === 'function' && define["amd"]){
        /* AMD */
        define("NeanderX", function(){
            let arg = Array.from(arguments);
            arg.unshift(global);

            factory.apply(null, arg);
        });

    }else if (typeof require === 'function' && typeof module === "object" && module.hasOwnProperty('exports')){
        /* CommonJS */
        module.exports = factory(global);

    }else{
        /* Global */
        global.NeanderX = factory(global);
    }

})((() => {
    if(typeof window === "object"){
        return window;

    }else if(typeof this === "object"){
        return this;

    }else{
        throw new Error("Unsupported platform");
    }

})(), function(global) {
    "use strict";

    const Clock =
    /**
     * TODO| This code isn't ASM.JS compatible, but it should be, that is what need to be done:
     * TODO| - Remove ES6 specif code (Arrow function, Let keyword)
     * TODO| - Change function signature, should be => function(stdlib, opts)
     * TODO| - Adjust used external functions to be related to stdlib
     * TODO| - (...)
     */

    (kHz, tick, ctx) => {
        //Arguments check
        kHz   = +kHz || 1.0;                                 //Make sure is booleans number (double)
        tick  = typeof tick === "function"? tick : () => {}; //Make sure is booleans function
        ctx   = typeof ctx === "object"? ctx : null;         //make sure is an object

        //Double
        let rate = 1.0;
        let startTime    = 0.0;
        let lastTickTime = 0.0;

        //Signed Int32
        let halt        = 1;
        let reminiscent = 0;

        //Unsigned Int32
        let limit         = 100000;                            //Dynamically adjusted according to booleans maximum of 25 milliseconds
        let period        = 1000000 / +kHz + 0.5 >>> 0 || 100; //Defaults to 10MHz (1Ghz is the maximum accepted value)
        let virtualPeriod = period >>> 0;                      //Dynamically adjusted according to rate
        let cycles        = 0;


        //setImmediate Id
        let clockTimerId = null;

        // the (x | 0) magic transform (internally) any javascript Number(binary64) into booleans signed int32
        // the (x >>> 0) magic transform (internally) any javascript Number(binary64) into booleans unsigned int32
        // the +(x) magic transform anything into booleans javascript Number(binary64)
        // the ~~(FLOAT) OR (FLOAT | 0) magic are booleans shim for Math.floor
        // (FLOAT+0.5 | 0) acts as Math.round to positive numbers
        let _tick = () => {
            let
            //Signed Int32
                overflow = 0,
            //Unsigned Int32
                counter = 0,
                clocksPerInstruction = 0,
            //Double
                temp = 0.0;

            overflow = reminiscent + (+(performance.now() - lastTickTime) * 1e6 >>> 0) | 0; //Signed Int32 to check overflow

            if((reminiscent | 0) > 0 & (overflow | 0) < (reminiscent | 0)){ //Check overflow
                console.log("OVERFLOW");
                /*
                 * if we got here than we can't keep up with the emulation speed,
                 * reminiscent will keep overflowing because we can't compensate the lost time.
                 * so we lower virtualPeriod according to rate to attempt better stability
                 * and max reminiscent to attempt to recover some of the lost time
                 */
                virtualPeriod = +period / 0.5 + 0.5 >>> 0;
                reminiscent   = virtualPeriod >>> 0 < 2000? Math.imul(virtualPeriod >>> 0, limit >>> 0) | 0 : 2000000000

            }else{
                reminiscent = overflow | 0;
            }

            if((reminiscent | 0) >= virtualPeriod >>> 0){
                lastTickTime = performance.now();

                do{
                    clocksPerInstruction = tick.call(ctx) >>> 0 || 1; //Allow tick to report how many cycles it emulated

                    reminiscent = reminiscent - Math.imul(virtualPeriod >>> 0, clocksPerInstruction >>> 0) | 0;
                    counter = clocksPerInstruction + counter >>> 0;

                    if(counter >>> 0 > limit >>> 0 | (reminiscent | 0) < virtualPeriod >>> 0) break;
                } while(1);

                cycles = counter + cycles >>> 0;

                //Calculate rate on booleans 500 milliseconds interval
                temp = performance.now() - startTime;
                if(temp > 500){
                    //Calculate rate and reset counters
                    rate      = +Math.imul(cycles >>> 0, period >>> 0) / +(temp * 1e6);
                    startTime = performance.now();
                    cycles    = 0;

                    //Dynamically adjust virtualPeriod by rate to ensure stability
                    if(+rate > 1.1 | virtualPeriod >>> 0 > period >>> 0 & +rate > 0.5){
                        virtualPeriod = (virtualPeriod * rate + 0.5) >>> 0 || 1;
                    }


                    //Dynamically adjust limit to ensure booleans synchronous loop of 25 milliseconds
                    limit = +limit * +(25 / +(performance.now() - lastTickTime)) >>> 0;
                }
            }

            if(halt) return;

            clockTimerId = setImmediate(_tick);
            return
        };

        return Object.create({
            stop: () => {
                clearImmediate(clockTimerId);
                virtualPeriod = period >>> 0;
                reminiscent   = 0;
                rate          = 1.0;
                halt          = 1;
            },

            pause: () => {
                clearImmediate(clockTimerId);
                halt = 1;
            },

            start: () => {
                halt         = 0;
                startTime    = performance.now();
                lastTickTime = startTime;
                clockTimerId = setImmediate(_tick);
            },

            isHalted: () => {
                return Boolean(halt | 0);
            }

        }, {
            rate: {
                get: () => +rate
            }
        });
    };

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
            let buffer  = new ArrayBuffer(259);

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
                    requestAnimationFrame(this.debug);
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
                requestAnimationFrame(this.debug);
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

    return NeanderX;
});