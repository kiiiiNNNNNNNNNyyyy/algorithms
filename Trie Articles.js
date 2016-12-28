/*
CPE590 / CS590 Algorithms Fall 2016

Group 2:
Arjun Dass
Miten Patel
Richard Quinones
Yugaank Sharma

Project 3, part 1: Company String Search

*/

// Setup variables
var fs = require("fs");
var util = require("util");
var rawcompfile = [];
var Companies = {};
var CompanyCount = {};
var CompanyWValue = {};
var ArticleStr = "";
var WordCount = 1;
var SortedCompanyKeys = [];
function GetCompanies() {
	fs.readFile("companies.dat","utf8",function (err,data) {
		if (err) {									//If fs.readFile returns and error, send it to console
			console.log("Error = ",err);
			return;
		}
		else {										//Store file data in string variable
			rawcompfile=data;
			var hasSyn = 0;
			var CoPhrase = "";
			var CoName = "";
			var CoSyn = "";
			for ( p = 0 ; p <= rawcompfile.length - 1 ; p++) {
				switch (rawcompfile[p]) {
					case '\t':			//<Tab> means there is a synonym for the company
						hasSyn = 1;
						if ( CoName == "" )	//Company name has not been set for this line, first field is Company name.
						{
							CoName = CoPhrase;
							//Normalize CoPhrase for CoSyn to remove punctuation
							var CoPhraseN = "";
							for (var q = 0; q < CoPhrase.length; q++)
								if ( CoPhrase[q] != "!" && CoPhrase[q] != ";" && CoPhrase[q] != ":" && CoPhrase[q] != "," && CoPhrase[q] != "." && CoPhrase[q] != "?" )
									CoPhraseN = CoPhraseN + CoPhrase[q];
							Companies [ CoPhraseN ] = CoName;
							CompanyCount [ CoPhraseN ] = 0;
							CompanyWValue [ CoPhraseN ] = 0;
							CoPhrase = "";
							CoPhraseN = "";
						}
						else			//Company name has already been set for this line, this is a synonym.
						{
							//Normalize CoPhrase for CoSyn to remove punctuation
							var CoPhraseN = "";
							for (var q = 0; q < CoPhrase.length; q++)
								if ( CoPhrase[q] != "!" && CoPhrase[q] != ";" && CoPhrase[q] != ":" && CoPhrase[q] != "," && CoPhrase[q] != "." && CoPhrase[q] != "?" )
									CoPhraseN = CoPhraseN + CoPhrase[q];
							CoSyn = CoPhraseN;
							Companies [ CoSyn ] = CoName;
							CoPhrase = "";
							CoPhraseN = "";
						}
						break;
					case '\n':			//<Newline> means end of company & synonyms
						if ( hasSyn == 1 ) {	//We have encountered a <tab>, so there are synonyms for the company
							//Normalize CoPhrase for CoSyn to remove punctuation
							var CoPhraseN = "";
							for (var q = 0; q < CoPhrase.length; q++)
								if ( CoPhrase[q] != "!" && CoPhrase[q] != ";" && CoPhrase[q] != ":" && CoPhrase[q] != "," && CoPhrase[q] != "." && CoPhrase[q] != "?" )
									CoPhraseN = CoPhraseN + CoPhrase[q];
							CoSyn = CoPhraseN;
							Companies[CoSyn] = CoName;
							CoPhrase = "";
							CoPhraseN = "";
							CoName = "";
							CoSyn = ""
							hasSyn = 0;
						}
						else {			//We have not encountered a <tab>, end of entry with no synonyms.
							CoName = CoPhrase;
							//Normalize CoPhrase for CoSyn to remove punctuation
							var CoPhraseN = "";
							for (var q = 0; q < CoPhrase.length; q++)
								if ( CoPhrase[q] != "!" && CoPhrase[q] != ";" && CoPhrase[q] != ":" && CoPhrase[q] != "," && CoPhrase[q] != "." && CoPhrase[q] != "?" )
									CoPhraseN = CoPhraseN + CoPhrase[q];
							Companies[ CoPhraseN ] = CoName;
							CompanyCount [ CoPhraseN ] = 0;
							CompanyWValue [ CoPhraseN ] = 0;
							CoPhrase = "";
							CoPhraseN = "";
							CoName = "";
							hasSyn = 0;
						}
						break;
					default:
						CoPhrase = CoPhrase + rawcompfile[p];	//keep building the phrase
						break;
				}
			}
			console.log("Companies object loaded.");
			console.log("\nEnter Article below. End with a \".\" on a line by itself.\n");
			var CompanyKeys = Object.keys(Companies);	//retrieve the keys from Companies
			var SortedCompanyIndices = Object.keys(CompanyKeys).sort(function(a,b){	//Sort the indices for the keys by key length, longest first
				if ( CompanyKeys[a].length > CompanyKeys[b].length )
					return -1
				else return 1;
			});
			var x = 0;
			for (var ind in SortedCompanyIndices ) {	//Create a sorted array of keys, longest first
				SortedCompanyKeys[x] = CompanyKeys[SortedCompanyIndices[ind]];
				x++;
			}
		}
	});
};

function GetArticleFrCons() {	//Read from stdin until receive a "." on the line by itself
	var tempStr;
	var rawWordCount = 1;
	var omitWordCount = 0;
	//The following is derived from https://nodejs.org/api/readline.html#readline_readline
	const readline = require('readline');
	
	const rl = readline.createInterface({
	  input: process.stdin,
	  output: process.stdout
	});
	rl.on('line', (input) => {
		if ( input == "." ) {	//If line only has a ".", remove leading and trailing spaces from ArticleStr and count words
			rl.close();
			ArticleStr = ArticleStr.trim();
			for ( c = 0; c < ArticleStr.length ; c++ )	//Word Count
				if ( ArticleStr[c] == " " )
				rawWordCount += 1;
			var LowerCaseArticleStr = ArticleStr.toLowerCase();
			var NoPunctArticleStr = "";
			var StartPoint, EndPoint, CompanyN;
			//Count omitted words
			var omittedWords = ["^and "," and!"," and;"," and:"," and,"," and."," and?","and ","^but "," but!"," but;"," but:"," but,"," but."," but?","but ","^the "," the!"," the;"," the:"," the,"," the."," the?","the ","^an "," an!"," an;"," an:"," an,"," an."," an?","an ","^a "," a!"," a;"," a:"," a,"," a."," a?","a "];
			for (var omt in omittedWords) {
				var stpoint = 0;
				var enpoint;
				enpoint = LowerCaseArticleStr.indexOf(omittedWords[omt]);
				while (enpoint != "-1") {
					omitWordCount = omitWordCount + 1;
					enpoint = LowerCaseArticleStr.indexOf(omittedWords[omt],enpoint + omittedWords[omt].length );
				}
			}
			for (var chr in ArticleStr) //Normalize TempString to remove punctuation
				if ( ArticleStr[chr] != "!" && ArticleStr[chr] != ";" && ArticleStr[chr] != ":" && ArticleStr[chr] != "," && ArticleStr[chr] != "." && ArticleStr[chr] != "?" )
					NoPunctArticleStr = NoPunctArticleStr + ArticleStr[chr];
			NoPunctArticleStr = NoPunctArticleStr + " #";
			WordCount = rawWordCount - omitWordCount;
//Begin String Search	
			var StartPoint, EndPoint, CompanyN;
			for (var j in SortedCompanyKeys ) {	//Search for sorted keys in copy of article string. If found increment counter and remove from string
				do {
					var SCK = SortedCompanyKeys[j].toLowerCase();
					var SCKC;
					var SCKV = 1;
					var SPNT = 0;
					for (OMT in omittedWords) {
						SCKC = SCK.indexOf(omittedWords[OMT]);
						while (SCKC > -1 ) {
							SCK = SCK.substr(0,SCKC - 1) + SCK.substr(SCKC + omittedWords[OMT].length,SCK.length);
							SCKC = SCK.indexOf(omittedWords[OMT]);
						}
					}
					for (var v in SCK) {
						if (SCK[v] == " ") SCKV = SCKV + 1;
					}
					StartPoint = NoPunctArticleStr.search(SortedCompanyKeys[j]) 
					if ( StartPoint != -1 ) {
						EndPoint = StartPoint + SortedCompanyKeys[j].length-1;
						NoPunctArticleStr = NoPunctArticleStr.slice(0,StartPoint-1) + NoPunctArticleStr.slice(EndPoint+1,NoPunctArticleStr.length);
						CompanyN = Companies[SortedCompanyKeys[j]];
						CompanyCount[CompanyN] = CompanyCount[CompanyN] + 1;
						CompanyWValue[CompanyN] = CompanyWValue[CompanyN] + SCKV;
					}
				}
				while ( StartPoint != -1 )
			}
//End String Search
//Begin Report
			var DaNames = Object.keys(CompanyCount);
			var AllDaHits = 0;
			var AllDaValue = 0;
			var RptStr = "";
			var RptStr2 = "";
			RptStr = util.format("===========================================================\n");
			RptStr2 = util.format("Company				Hit	Relevance\n");
			RptStr = RptStr + RptStr2;
			RptStr2 = util.format("				Count\n");
			RptStr = RptStr + RptStr2;
			RptStr2 = util.format("===========================================================\n");
			RptStr = RptStr + RptStr2;
			for ( var Co in DaNames) {
				if ( DaNames[Co].length % 8 == 0)
					var NumTabs = Math.floor(3 - (DaNames[Co].length / 8));
				else
					var NumTabs = Math.floor(4 - (DaNames[Co].length / 8));
				switch (NumTabs) {
					case 1:
						RptStr2 = util.format("%s		%s	%s%%\n",DaNames[Co],CompanyCount[DaNames[Co]],CompanyWValue[DaNames[Co]] / WordCount * 100);
						RptStr = RptStr + RptStr2;
						AllDaHits = AllDaHits + CompanyCount[DaNames[Co]];
						AllDaValue = AllDaValue + CompanyWValue[DaNames[Co]];
						break;
					case 2:
						RptStr2 = util.format("%s			%s	%s%%\n",DaNames[Co],CompanyCount[DaNames[Co]],CompanyWValue[DaNames[Co]] / WordCount * 100);
						RptStr = RptStr + RptStr2;
						AllDaHits = AllDaHits + CompanyCount[DaNames[Co]];
						AllDaValue = AllDaValue + CompanyWValue[DaNames[Co]];
						break;
					case 3:
						RptStr2 = util.format("%s				%s	%s%%\n",DaNames[Co],CompanyCount[DaNames[Co]],CompanyWValue[DaNames[Co]] / WordCount * 100);
						RptStr = RptStr + RptStr2;
						AllDaHits = AllDaHits + CompanyCount[DaNames[Co]];
						AllDaValue = AllDaValue + CompanyWValue[DaNames[Co]];
						break;
					default:
						RptStr2 = util.format("%s					%s	%s%%\n",DaNames[Co],CompanyCount[DaNames[Co]],CompanyWValue[DaNames[Co]] / WordCount * 100);
						RptStr = RptStr + RptStr2;
						AllDaHits = AllDaHits + CompanyCount[DaNames[Co]];
						AllDaValue = AllDaValue + CompanyWValue[DaNames[Co]];
						break;
				}
			}
			RptStr2 = util.format("===========================================================\n");
			RptStr = RptStr + RptStr2;
			RptStr2 = util.format("	Total			%s	%s%%\n",AllDaHits,AllDaValue / WordCount);
			RptStr = RptStr + RptStr2;
			RptStr2 = util.format("===========================================================\n");
			RptStr = RptStr + RptStr2;
			RptStr2 = util.format("	Total Words		%s\n",WordCount);
			RptStr = RptStr + RptStr2;
			RptStr2 = util.format("===========================================================\n");
			RptStr = RptStr + RptStr2;
			console.log(RptStr);
//End Report
		}
		else {
			tempStr = input.trim() + " ";	//Otherwise trim leading and trailing spaces, add a space at the end, & concatenate to ArticleStr
			ArticleStr = ArticleStr + tempStr;
		}
	});
}
GetCompanies();
GetArticleFrCons();
