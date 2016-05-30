//?...
Macro.ArrayInit = (size, val) => {
	if(Array.isArray(size) && typeof val === "number"){
		let temp = val;
		val = size;
		size = val.length * temp;

	}else if(typeof size === "number"){
		val = Array.isArray(val)? val : [val];

	}else{
		throw new Error('Bad Formated Macro');
	}

	let macroString = '[';
	
	for(let counter = 0, index = 0; counter < size; counter++, index = (index + 1) % val.length){
		macroString += JSON.stringify(val[index]) + ((counter+1) < size? ', ' : ']');
	}

	macro.pushString(macroString);
};
//?.