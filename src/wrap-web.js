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
    
    //? include("./NeanderX.js");
    
    return NeanderX;
});