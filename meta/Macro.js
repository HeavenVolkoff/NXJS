//?...
Macro = class Macro{
    constructor(){
        this.str = '';
        this.instructionMode = false;
        this.lastSeparator = null;
    }

    pushString(str){
        this.instructionMode = false;
        this.lastSeparator = null;
        this.str = str;

        return this;
    }

    pushInstruction(separator, str){
        if(!str){
            str = separator;
            separator = null;
        }

        if(!this.instructionMode){
            this.str = '(';

            if(Array.isArray(str)){
                let separatorString = separator? ` ${separator} ` : ', ';

                str.forEach((s, index) => {
                    this.str += (index === 0? '': separatorString) + s + (index + 1 < str.length? '' : ')');
                });

                this.lastSeparator = separator;

            }else{
                this.str += str + ')';
                this.lastSeparator = null;
            }

            this.instructionMode = true;

        }else{
            if(this.lastSeparator && this.lastSeparator !== separator){
                this.str = '(' + this.str;

            }else{
                this.str = this.str.substr(0, this.str.length - 1);
            }

            let separatorString = separator? ` ${separator} ` : ', ';

            if(Array.isArray(str)){
                str.forEach((s, index) => {
                    this.str += separatorString + s + (index + 1 < str.length? '' : ')');
                });

            }else{
                this.str += (separator? ` ${separator} ` : ', ') + str + ')';
            }

            this.lastSeparator = separator? separator : ',';
        }

        return this;
    }

    $(format){
        this.instructionMode = false;
        format = format || 0;

        if(format & Macro.IN){
            this.str = __ + this.str.replace(/\n/g , '\n' + __);
        }

        write(this.str + (format & Macro.LB? '\n' : ''));
    }
};

Object.defineProperties(Macro, {
    LB: {
        value: 0b01,
        writable: false
    },

    IN: {
        value: 0b10,
        writable: false
    }
});

LB = Macro.LB;
IN = Macro.IN;
macro = new Macro();
//?.
