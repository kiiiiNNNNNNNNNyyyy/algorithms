/*
CPE590 / CS590 Algorithms Fall 2016

Group 2:
Arjun Dass
Miten Patel
Richard Quinones
Yugaank Sharma

Project 2: Huffman Coding

***NOTE: Percentages may not add up to 100%. This is due to rounding to an integer. We chose not to add decimal precentages to match required output. ***

*/

// Setup variables
var fs = require("fs");
var inputtextfile = [];
var binCodes = {};
var outputfiletext;
var TotalFileChars;
var output = "";
var ValidChars = {'A':0,'B':0,'C':0,'D':0,'E':0,'F':0,'G':0,'H':0,'I':0,'J':0,'K':0,'L':0,'M':0,'N':0,'O':0,'P':0,'Q':0,'R':0,'S':0,'T':0,'U':0,'V':0,'W':0,'X':0,'Y':0,'Z':0,'a':0,'b':0,'c':0,'d':0,'e':0,'f':0,'g':0,'h':0,'i':0,'j':0,'k':0,'l':0,'m':0,'n':0,'o':0,'p':0,'q':0,'r':0,'s':0,'t':0,'u':0,'v':0,'w':0,'x':0,'y':0,'z':0,'0':0,'1':0,'2':0,'3':0,'4':0,'5':0,'6':0,'7':0,'8':0,'9':0};
fs.readFile("infile.dat","utf8",function (err,data) {
	if (err) {													//If fs.readFile returns and error, send it to console
		console.log("Error = ",err);
		return;
	}
	else {														//Store file data in string variable inputtextfile
		inputtextfile=data;
		var WordCount = 1;											//Initialize word counter
		
		for ( p = 0 ; p <= inputtextfile.length - 1 ; p++) {
			if ( inputtextfile[p] === " " )									//If next character is a space increment word counter
				WordCount = ++WordCount;
			else if ( inputtextfile[p] in ValidChars ) {							//If next character is in ValidChars object
				if ( outputfiletext === undefined )							//If this is the first valid character initialize ouputfiletext string variable
					outputfiletext = inputtextfile[p];
				else											//If this is not the first valid character append it onto outputfiletext string variable
					outputfiletext = outputfiletext + inputtextfile[p];
			}
		}
		run(outputfiletext);
		//console.log(y);
		fs.writeFile('outfile.dat', output, function (err) {							//Write outfile.dat 
			if (err)
				console.log("Error = ", err);
			else
				console.log("outfile.dat saved!");
		});
	}
});




function count(data){
	var counts={};
	for (var i in data){

		if(counts[data[i]]==undefined){
															//Counting the frequency of each character which is in dataing or the data
			counts[data[i]]=1;										//read from the file infile.dat minus the spaces and special characters
		}
		else {
			counts[data[i]]=counts[data[i]]+1;
		}
	}

	return counts;
}

function sortDataFreq(datafreqs){
	var input=[];
	var temp1=0;
	var temp2='';
	for( var ch in datafreqs){											//SORTING THE characters with respect to their frequency in the text file
		input.push([datafreqs[ch],ch]);
	}
	for(var i=0;i<input.length;i++)
	{
		for(var j=0;j<input.length;j++)
		{
			if(input[i][0]<input[j][0])
			{
				temp1=input[i][0];
				temp2=input[i][1];									//Sorting COntinues...
				input[i][0]=input[j][0];
				input[i][1]=input[j][1];
				input[j][0]=temp1;
				input[j][1]=temp2;
			}
		}
		
	}
	return input;
}
	
function buildTree(input)
{
	while(input.length>1)
	{
		var twoLowestValues = input.slice(0,2);									//taking first two values from the array(lowest)
		var remainingInput  = input.slice(2,input.length);							//copying the remaining array to another variable
		var combFreq = twoLowestValues[0][0] + twoLowestValues[1][0]						//adding the frequencies of the lowest values 
		input=remainingInput;											//the array input without the first two elements
		var add = [combFreq,twoLowestValues];									//add element which would contain the sum of freqencies and the respective character
		input.push(add);											//adding the above element in the array(pushed into last)
		//console.log(input);
		for(var i=0;i<input.length;i++)
		{
			for(var j=0;j<input.length;j++)									//Sorting the array input after the push function				
			{
				if(input[i][0]<input[j][0])
				{											//while loop - does the above steps for all elements,
					temp1=input[i][0];								//finally putting all the combined elements in a tree like structure in first element
					temp2=input[i][1];								//reducing the size of input to 1 from x
					input[i][0]=input[j][0];
					input[i][1]=input[j][1];
					input[j][0]=temp1;
					input[j][1]=temp2;
				}
			}

		}
		//console.log(input)
	}
	return input[0];												//after the while loop, only first element would contain the tree so returning the first element
}																			
 function finalTree(modifyTree)
{
	var x = modifyTree[1];												//this functions checks the type of value which the tree contains, passed from above function			
	if (typeof(x)===typeof(''))
		return x;												//if the node is child, it will return the child node
	else														//else the node is parent, it will run recursively for its child nodes	
		return (Array(finalTree(x[0]),finalTree(x[1])));
}
function binChar(child,ch){
    
    if (typeof(child)==typeof(''))
	binCodes[child]=ch;												//if the parent is on left side, it will define the ch variable 0 and will 
    else{														//further concatenate the 0 value if its child is in left position or 1 if in right position
	binChar(child[0],ch+'0');
	binChar(child[1],ch+'1');
    }
    return binCodes;													//return the binary code for each character one by one of the tree
}
function secret(data){
    convertedBinary='';
    for(ch in data){													//it will concatenate all the binary codes of all the characters and will return the file text in binary encrypted form saving up the storage
	convertedBinary =convertedBinary+binCodes[data[ch]];
    }
    return convertedBinary.length;
}
function Tables(priorityqueue,codes,dlength) {						//Function to format output for outfile.dat
	output = "Frequency Percentages\n";						//header for first table
	totalfilechars = outputfiletext.length;
	for (sym in priorityqueue) {							//Percentage Table
		Pct = Math.round(priorityqueue[sym] / totalfilechars * 100);
		output = output + sym + ", " + Pct +"%\n";
	}
	output = output + "\nHuffman Codes\n";						//Header for second table
	for (sym in codes) {								//Huffman Code Table
		output = output + sym + ", " + codes[sym] + "\n";
	}	
	output = output + "\nTotalByte Length = " + dlength + "\n"; 			//Coded file length
	return output;
}
function run(data)
{ 
	var a=count(data);					//returns the count table-: characters and their frequency
	var b=sortDataFreq(a);				//returns the sorted table	
	var c=buildTree(b);					//builds the initial tree
	var d=finalTree(c);					//modifies the above tree-(picking up the characters)
	var e=binChar(d,'');				//encodes the each character
	var f=secret(data);					//encodes the whole file in binary format
	var g=Tables(a,e,f);				//returns the output and later the program writes that data to outfile.dat
}
