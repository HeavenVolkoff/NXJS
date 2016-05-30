((global) => {
    "use strict";

    const $   = global.document;
    const GUI = {
        debug: () => {
            let debug = $.querySelector("#debug");
            
            return {
                pre:{
                    pc:       debug.querySelector("#pc"),
                    acc:      debug.querySelector("#acc"),
                    rate:     debug.querySelector("#rate"),
                    zero:     debug.querySelector("#zero"),
                    opcode:   debug.querySelector("#opcode"),
                    negative: debug.querySelector("#negative")
                },

                write: (pc, rate, opcode, acc, negative, zero) => {
                    pc       = pc       | 0;
                    acc      = acc      | 0;
                    zero     = zero     | 0;
                    negative = negative | 0;

                    rate   = +rate;
                    opcode = String(opcode);

                    GUI.debug.pre.opcode.textContent = opcode.toUpperCase().padEnd(3, ' ');
                    GUI.debug.pre.rate.textContent   = rate.toFixed(2);

                    GUI.debug.pre.pc.textContent       = "0x" + pc.toString(16).toUpperCase().padStart(2, 0);
                    GUI.debug.pre.acc.textContent      = "0x" + acc.toString(16).toUpperCase().padStart(2, 0);
                    GUI.debug.pre.zero.textContent     = "0x" + zero.toString(16).toUpperCase().padStart(2, 0);
                    GUI.debug.pre.negative.textContent = "0x" + negative.toString(16).toUpperCase().padStart(2, 0);
                }
            }
        },
        
        display: () => {
            let display = $.querySelector("#display");
            
            return {
                pre: display.querySelector("pre"),

                write: num => {
                    num = num|0;
                    GUI.display.pre.textContent = num.toString(16).padStart(2, '0');
                }
            }
        },

        switches: () => {
            let switches = $.querySelector("#switches");
            let self = {
                element: switches,
                
                hex:          switches.querySelector("small.hexa pre"),
                decimal:      switches.querySelector("small.decimal pre"),
                switchInputs: new Array(8),
                switchesForm: switches.querySelector("form.switches"),

                read: () => {
                    let num = 0;

                    for(let i = 0; i < GUI.switches.switchInputs.length; i++){
                        num = num + (GUI.switches.switchInputs[i].checked << i) | 0;
                    }

                    return num;
                }
            };
            let listeners = {
                switchInputChange: () => {
                    let num = self.read();
                    
                    self.hex.textContent     = "0x" + num.toString(16).toUpperCase().padStart(2, '0');
                    self.decimal.textContent = num;
                }
            };

            //Set-Up
            for(let i = 0; i < self.switchInputs.length; i++){
                let _switch = document.createElement('input');
                let label   = document.createElement('label');

                _switch.setAttribute('type', 'checkbox'   );
                _switch.setAttribute('id',   `switch_${i}`);

                _switch.addEventListener('change', listeners.switchInputChange);

                label.setAttribute('for', _switch.getAttribute('id'));

                self.switchesForm.appendChild(_switch);
                self.switchesForm.appendChild(label);

                self.switchInputs[self.switchInputs.length - (i + 1)] = _switch;
            }
            
            return self;
        },
        
        readyCheck: () => {
            let readyForm = GUI.switches.element.querySelector('form.readyCheck');
            let self = {
                checkbox: readyForm.querySelector('#ready_check'),
                
                read: () => {
                    let checked = GUI.readyCheck.checkbox.checked | 0;
                    
                    GUI.readyCheck.checkbox.checked = false;
                    listeners.checkboxChange();

                    return checked;
                }
            };
            let listeners = {
                checkboxChange: () => {
                    let state = self.checkbox.checked;
                    
                    for(let i = 0; i < GUI.switches.switchInputs.length; i++){
                        GUI.switches.switchInputs[i].disabled = state;
                    }
                }
            };

            self.checkbox.addEventListener('click', listeners.checkboxChange);

            return self;
        }
    };

    //Exec each GUI prop set-up function
    for(let key in GUI){
        if(GUI.hasOwnProperty(key) && typeof GUI[key] === "function"){
            GUI[key] = GUI[key]();
        }
    }

    //Initialize Neander
    const NeanderX = window.NeanderX;
    const neander = new NeanderX({
        kHz: 1,
        output:[
            GUI.display
        ],
        input: [
            GUI.switches,
            GUI.readyCheck
        ],
        hex: "C0017001A01E800000000000000000000000000000000000000000000000C00010E610E7E000803C0000000000000000000000000000000000000000E00010E8804600000000E0F630E7906410E7E00130E810E880460000000000000000000000000000E0FF30E8908210E8E00630E610E68064000000000000000000000000000020E6D000F0",
        debug: function(){
            let pc = this.pc[0];

            GUI.debug.write(pc, this.clock.rate, this.opCodes[this.memory[pc] >>> 4] || "ERROR", this.acc[0], this.flags[0], this.flags[1]);
        }
    });
})(window);