((global) => {
    "use strict";

    /* ================ Utilitarian functions ================ */
    /**
     * Assign handlers on assignee to the related props on mainObj
     *
     * @param {Object} mainObj
     * @param {(String|String[])} props
     * @param {Object} assignee
     * @returns {Object}
     */
    function borrowProps(mainObj, props, assignee){
        props = Array.isArray(props)? props : [props];

        for(let i = 0; i < props.length; i++){
            let prop = props[i];

            if(prop in mainObj){
                Object.defineProperty(assignee, prop, {
                    get: () => {
                        if(typeof mainObj[prop] === 'function'){
                            return function(){
                                return mainObj[prop].apply(mainObj, arguments);
                            }
                        }

                        return mainObj[prop];
                    }
                });

            }else{
                throw Error("Invalid Property: " + prop)
            }
        }

        return assignee;
    }
    /* ======================================================= */

    /* ================ Global Variables ================*/
    const NeanderX = global.NeanderX;
    const alertify = global.alertify;
    const $        = global.document;
    /* ==================================================*/

    /* ================ GUI (DOM) Set-Up ================*/
    const GUI = {
        debug: () => {
            let debug    = $.querySelector("#debug"),
                pc       = debug.querySelector("pre.pc"),
                acc      = debug.querySelector("pre.acc"),
                rate     = debug.querySelector("pre.rate"),
                zero     = debug.querySelector("pre.zero"),
                opcode   = debug.querySelector("pre.opcode"),
                negative = debug.querySelector("pre.negative");
            
            return borrowProps(debug, 'querySelector',
                {
                    write: ($pc, $rate, $opcode, $acc, $negative, $zero) => {
                        $pc       = $pc       | 0;
                        $acc      = $acc      | 0;
                        $zero     = $zero     | 0;
                        $negative = $negative | 0;

                        $rate   = ($rate > 0? $rate|0 : 1) * 100 + 0.5 | 0;
                        $opcode = String($opcode);

                        opcode.textContent = $opcode.toUpperCase().padEnd(3, ' ');
                        rate.textContent   = (String($rate) + '%').padStart(4, ' ');

                        pc.textContent       = "0x" + $pc.toString(16).toUpperCase().padStart(2, 0);
                        acc.textContent      = "0x" + $acc.toString(16).toUpperCase().padStart(2, 0);
                        zero.textContent     = "0x" + $zero.toString(16).toUpperCase().padStart(2, 0);
                        negative.textContent = "0x" + $negative.toString(16).toUpperCase().padStart(2, 0);
                    }
                }
            );
        },

        loadFile: () => {
            let loadFile   = GUI.debug.querySelector("button.load-file");
            let inputFile  = loadFile.querySelector("input[type=file]");
            let onFileLoad = null;

            loadFile.addEventListener('click', () => {
                inputFile.dispatchEvent(new Event('click'));
            });

            inputFile.addEventListener('change', () => {
                if(onFileLoad){
                    onFileLoad(inputFile.files[0]);
                    inputFile.value = null;
                }
            });

            return {
                set onFileLoad (func){
                    if(typeof func !== "function"){
                        throw new TypeError("Value must be a function");
                    }

                    onFileLoad = func;
                }
            };
        },
        
        display: () => {
            let display = $.querySelector("#display"),
                pre     = display.querySelector("pre");
            
            return num => { //Write function
                num = num|0;
                pre.textContent = num.toString(16).padStart(2, '0');
            }
        },

        switches: () => {
            let switches     = $.querySelector("#switches"),
                hex          = switches.querySelector(".hexa > pre"),
                decimal      = switches.querySelector(".decimal > pre"),
                switchesForm = switches.querySelector("form.switches"),
                switchInputs = new Array(8);

            let readBinaryFromSwitchInput = () => {
                    let num = 0;

                    for(let i = 0; i < switchInputs.length; i++){
                        num = num + (switchInputs[i].checked << i) | 0;
                    }

                    return num;
                },
                switchInputChange = () => {
                    let num = readBinaryFromSwitchInput();

                    hex.textContent     = "0x" + num.toString(16).toUpperCase().padStart(2, '0');
                    decimal.textContent = num;
                };

            //Set-Up Switch Inputs
            for(let i = 0; i < switchInputs.length; i++){
                let _switch = document.createElement('input');
                let label   = document.createElement('label');

                _switch.setAttribute('type', 'checkbox'   );
                _switch.setAttribute('id',   `switch_${i}`);

                _switch.addEventListener('change', switchInputChange);

                label.setAttribute('for', _switch.getAttribute('id'));

                switchesForm.appendChild(_switch);
                switchesForm.appendChild(label);

                switchInputs[switchInputs.length - (i + 1)] = _switch;
            }
            
            return borrowProps(switches, 'querySelector',
                {
                    read: readBinaryFromSwitchInput,

                    disableInput: (state) => {
                        for(let i = 0; i < switchInputs.length; i++){
                            switchInputs[i].disabled = state;
                        }
                    }
                }
            );
        },
        
        readyCheck: () => {
            let switchesReady = GUI.switches.querySelector('.switches-ready');

            let clicked = false;

            let switchesReadyClicked = () => {
                if(clicked){
                    switchesReady.classList.remove("clicked");
                    clicked = false;

                }else{
                    switchesReady.classList.add("clicked");
                    clicked = true;
                }

                GUI.switches.disableInput(clicked);
            };

            switchesReady.addEventListener('click', switchesReadyClicked);

            return () => { //Read function
                if(clicked){
                    switchesReadyClicked();
                    return true;
                }

                return false;
            }
        }
    };

    //Exec each GUI prop set-up function
    for(let key in GUI){
        if(GUI.hasOwnProperty(key) && typeof GUI[key] === "function"){
            GUI[key] = GUI[key]();
        }
    }
    /* =================================================== */

    /* ================ Neander Set-Up ================ */
    const neander = new NeanderX({
        kHz: 1,
        output:[
            GUI.display
        ],
        input: [
            GUI.switches,
            GUI.readyCheck
        ],
        debug: (cpu) => {
            let pc = cpu.pc[0];
            GUI.debug.write(pc, cpu.clock.rate, cpu.opCodes[cpu.memory[pc] >>> 4] || "ERROR", cpu.acc[0], cpu.flags[0], cpu.flags[1]);
        }
    });

    GUI.loadFile.onFileLoad = (file) => neander.load(file, (err) => {
        if(err){
            alertify.error('Error while loading file, please try again');
            throw err;
        }

        alertify.success('File Loaded');
        neander.cpu.start();
    });
    /* ================================================= */
})(window);