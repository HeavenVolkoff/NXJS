class AssertError extends Error{
    constructor(message, errorCode){
        super(`AssertError: ${message}`);
        this.code = errorCode;
    }
}
//? if(NODE){
module.exports = AssertError;
//? }