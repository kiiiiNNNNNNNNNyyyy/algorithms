/*
CPE590 / CS590 Algorithms Fall 2016

Group 2:
Arjun Dass
Miten Patel
Richard Quinones
Yugaank Sharma

Final Project: Link State Routing

*/

//To run the program please first run 'npm install prompt --save'command to install the prompt module.

var dbg = false ;	//values true / false	- If true, makes "C" more verbose and shows all router classes at start and upon "Q".
var fs = require('fs');																//reading the infile.dat
var prompt = require('prompt');														//for input
var util = require("util");

function Packet(id,seq,ttl,reaches) {							//packet class takes id, sequence number, time to live and reachables as arguments
	this.Id = id;
	this.Seq = seq;
	this.Ttl = ttl;
	this.Reachables = reaches;
}

function RoutingTable (network,cost,outgoing) {					//routing table function that takes network id, cost, and outgoing link as arguments
	this.DestId = network;
	this.DestCost = cost;
	this.OrigRoute = outgoing;
}

function PriorityQueue () {										//priority queue that stores nodes, enqueue, dequeue, sort, and tests if the queue is empty or not
	this._nodes = [];

	this.enqueue = function (priority, key) {					//enqueue function
		this._nodes.push({key: key, priority: priority });
		this.sort();
	}
	
	this.dequeue = function () {								// dequeue function
		return this._nodes.shift().key;
	}

	this.sort = function () {									//sort function
		this._nodes.sort(function (a, b) {
			return a.priority - b.priority;
		});
	}
	this.isEmpty = function () {								//empty test function
		return !this._nodes.length;
	}
}

/**
 * Graph function, draws the graph, adds the nodes, edges of each node, finds the shortest path
 */
function Graph(){
	var infinity = 1/0;								//sets undefined
	this.vertices = {};								//vertices
	
	this.addVertex = function(name, edges){						//function that adds the edges of a node
		this.vertices[name] = edges;
	}
	this.shortestPath = function (start, finish) {					//finds the shortest path
		var nodes = new PriorityQueue(), distances = {}, previous = {}, path = [], smallest, vertex, closestNode, alt;
		for(vertex in this.vertices) {
			if(vertex === start) {									//if the node is present
				distances[vertex] = 0;								//add the node to the priority queue
				nodes.enqueue(0, vertex);
			}
			else {
				distances[vertex] = infinity;						//otherwise sets the distance to undefined and add it to priority queue
				nodes.enqueue(infinity, vertex);
			}
			previous[vertex] = null;
		}
		while(!nodes.isEmpty()) {									//while the queue is not empty									
			smallest = nodes.dequeue();								//dequeue the node from queue
			if(smallest === finish) {								//if the node is equal to the destination node
				path;
				while(previous[smallest]) {							//while there is a previous node
					path.push(smallest);							//push the node to the path
					smallest = previous[smallest];					//set the smallest to previous while it is not null
				}
				break;												//break;
			}
			if(!smallest || distances[smallest] === infinity){		
				continue;
			}
			for(closestNode in this.vertices[smallest]) {
				alt = distances[smallest] + this.vertices[smallest][closestNode];					//alt=distance
				if(alt < distances[closestNode]) {													//if alt is less than previous stored distance
					distances[closestNode] = alt;													//swaps the value and stores it
					previous[closestNode] = smallest;
					nodes.enqueue(alt, closestNode);											// enqueues the value to the node
				}
			}
		}
		return [path[0],distances[finish],path.reverse()[0]];							//returns the destination node, cost it takes, and originating link
	}
}

function Router(id, network, cost) {						//router class
	this.Id = id;
	this.Network = network;
	this.Cost = cost;
	this.RouterEnable = 1;
	this.Gtick = 0;
	this.Rtick = {};
	this.MYseq = 0;
	this.RTseq = {};
	this.MRoutelist = {};
	this.Routelist = {};
	this.RouteTable = [];
}
	
Router.prototype.BuildRouteTable = function (RouterIndx) {								//building route table here
	var x = new Graph();																	// graph
	for(var c=0;c<AllRouters.length;c++) {
		x.addVertex(AllRouters[c].Id, AllRouters[c].Routelist);
	}
	AllRouters[RouterIndx].RouteTable = [];
	for (var d=0 ; d < AllRouters.length ; d++) {
		if(AllRouters[d].RouterEnable == 1){
			var SourceRouter = AllRouters[RouterIndx].Id;
			var DestRouter = AllRouters[d].Id;
			currentRouterId = SourceRouter;
			if ( SourceRouter != DestRouter ){
				var RLArray = x.shortestPath(SourceRouter,DestRouter);
				var routingTable = new RoutingTable(RLArray[0],RLArray[1],RLArray[2]);
				AllRouters[RouterIndx].RouteTable.push(routingTable);	
			}
		}
	}
}

Router.prototype.BuildRTickObject = function (RouterIndx) {						//initialize remote router tick counter object
	var RlKeys = Object.keys(AllRouters[RouterIndx].Routelist);
	for ( var q = 0 ; q < RlKeys.length ; q++ )
		if ( AllRouters[RouterIndx].Routelist[RlKeys[q]] != undefined )
			AllRouters[RouterIndx].Rtick[RlKeys[q]] = 0;
}

Router.prototype.BuildRTseqObject = function (RouterIndx) {						//initialize sequence number object
	for ( var q = 0 ; q < AllRouters[RouterIndx].RouteTable.length ; q++ )
		if ( AllRouters[RouterIndx].RouteTable[q].DestId != undefined )
		AllRouters[RouterIndx].RTseq[AllRouters[RouterIndx].RouteTable[q].DestId] = 0;
}
Router.prototype.originatePacket = function() {
	if ( this.RouterEnable == 1 ) {
		this.Gtick=0;
		if ( dbg ) console.log("originatePacket:Hey! Id",this.Id,"is alive.");
		this.MYseq = this.MYseq +1;
		var packet = new Packet(this.Id,this.MYseq,10,this.Routelist);				//should reachables consist of those routers which are turned off???? Yes I think so because the originating router cannot know remote is turned off.
		if ( dbg ) console.log("originatePacket: Id",this.Id,"This is my new packet:",packet);
		var ReachableIds = Object.keys(packet.Reachables);
		this.Gtick = this.Gtick + 1;
		for (var h in ReachableIds ) {
			if ( ReachableIds[h] != this.Id) {
				if ( dbg ) console.log("originatePacket: Id",this.Id,"Gtick is now",this.Gtick);
				if ( this.Gtick - this.Rtick[ReachableIds[h]] > 1 ) {
					this.Routelist[ReachableIds[h]] = 10000000000;
					for ( var i = 0 ; i < AllRouters.length ; i++ )
						if ( AllRouters[i].Id == this.Id ) {
							if ( dbg ) console.log("receivePacket: Id",this.Id,"Needs to rebuild its own route table: Gtick=",this.Gtick ,",Rtick for",this.Rtick[ReachableIds[h]],"=",this.Rtick[ReachableIds[h]],AllRouters[i].Routelist);
							this.BuildRouteTable(i);
							AllRouters[i].BuildRouteTable(i);
						}
				}
				for (var j = 0 ; j < AllRouters.length ; j++ ) {
					if ( AllRouters[j].Id == ReachableIds[h] ) {
						if ( dbg ) console.log("originatePacket: Id",this.Id,"Sending packet with originating ID",packet.Id,"to Id",ReachableIds[h]);
						AllRouters[j].receivePacket(packet,this.Id);
					}
				}
			}
		}
	}
	else {
		if ( dbg ) console.log("originatePacket:Sorry Id",this.Id,"is taking a break.");
	}
}

Router.prototype.receivePacket = function(packet,sender) {
	var senderId = sender;
	var packetid = packet.Id;
	var packetseq = packet.Seq;
	var packetttl = packet.Ttl;
	if ( dbg && this.RouterEnable == 1) console.log("receivePacket: Id",this.Id,"received a packet with TTl of",packetttl,"from Id",senderId);
	if ( this.RouterEnable == 0 && dbg)							//discard packet if router is turned off
	{
		console.log("Packet Discarded as Router: ",this.Id," is switched off!")
		return 
	}
	packetttl = packetttl - 1;								//decrement TTL
	if ( dbg ) console.log("receivePacket: Id",this.Id,"New TTl is",packetttl);
	if ( dbg ) console.log("receivePacket: Id",this.Id,"setting the Receive tick for Id",senderId,"to",this.Gtick);
	this.Rtick[senderId] = this.Gtick;							//set tick for remote router to my current tick
	if ( packetttl <= 0 ) {									//if TTL has reached 0, discard packet
		if ( dbg ) console.log("receivePacket: Id",this.Id,"a packet with TTl=0 from Id",senderId,". Bye-Bye packet.");
		return
	}
	if ( packetseq <= remoteseq ) {								//if packet sequence number is less than stored sequence number discard packet
		if ( dbg ) console.log("receivePacket: Id",this.Id,"Stored sequence number higher than new sequence number. Bye-Bye packet.");
		return
	}
	if ( this.Routelist[senderId] >= 10000000000 ) {					//if remote router has max cost, put back to original cost
		if ( dbg ) console.log("receivePacket: id",this.Id,"resetting cost for",senderId,"Gtick=",this.Gtick,", Rtick=",this.Rtick[senderId]);
		this.Routelist[senderId] = this.MRoutelist[senderId];
	}
	if ( dbg ) console.log("receivePacket: Id",this.Id,"Stored Sequence Numbers",this.RTseq);
	RTseqKeys = Object.keys(this.RTseq)
	for ( var z = 0 ; z < RTseqKeys.length ; z++ ) {					//update sequence number for remote router
		if ( RTseqKeys[z] == packetid )
			var remoteseq = this.RTseq[z];
	}
	var fpacket = new Packet(packetid,packetseq,packetttl,this.Routelist);			//create new packet to forward
	if ( dbg ) console.log("receivePacket: Id",this.Id,"This is my forwarding packet:",fpacket);
	var ReachableIds = Object.keys(fpacket.Reachables);
	this.Gtick = this.Gtick + 1;
	for (var h in ReachableIds ) {
		if ( ReachableIds[h] != this.Id) {
			if ( this.Gtick - this.Rtick[senderId] > 1 ) {				//if the difference between my tick and the stored tick for remote router is 2 or more, max out cost
				this.Routelist[senderId] = 10000000000;
				for ( var i = 0 ; i < AllRouters.length ; i++ )
					if ( AllRouters[i].Id == this.Id ) {			//rebuild Route Table with new cost
						if ( dbg ) console.log("receivePacket: Id",this.Id,"Needs to rebuild its own route table: Gtick=",this.Gtick ,",Rtick for Id",senderId,"=",this.Rtick[senderId],AllRouters[i].Routelist);
						this.BuildRouteTable(i);
						AllRouters[i].BuildRouteTable(i);
					}
			}
			for (var j = 0 ; j < AllRouters.length ; j++ ) {			//send out forwarded packet to directly connected Routers
				if ( AllRouters[j].Id == ReachableIds[h] && AllRouters[j].Id != fpacket.Id && AllRouters[j].RouterEnable==1 ) {
					if ( dbg ) console.log("receivePacket: Id",this.Id,"Packet originated from Id",fpacket.Id,"sending to Id",ReachableIds[h]);
					AllRouters[j].receivePacket(fpacket,this.Id);
				}
			}
		}
	}
}

function printRoutingTable(id){
	var x =0;
	for(var i=0;i<AllRouters.length;i++){
		if(id === AllRouters[i].Id)
			for ( var x = 0 ; x <AllRouters[i].RouteTable.length ; x++ )
				console.log(AllRouters[i].RouteTable[x].DestId,",",AllRouters[i].RouteTable[x].DestCost,",",AllRouters[i].RouteTable[x].OrigRoute);
	}
	if(x == 0){
		console.log("Router with this Id Does not exist!! Try Again.");
	}
}

RouterON = function (id) {
	var x=0;
	for(var i = 0;i<AllRouters.length;i++){
		if(id === AllRouters[i].Id){
			x=1;
			if(AllRouters[i].RouterEnable == 0){
				AllRouters[i].RouterEnable = 1;
				console.log("\nRouter with Id: " + id + " is now enabled.\n");
			}else{
				console.log("\nThis router is already enabled!!\n");
			}
		}
	}
	if(x==0){
		console.log("\nRouter with this id Does not exist!! Try Again!!\n");
	}
}

RouterOFF = function (id) {
	var x=0;
	for(var i = 0;i<AllRouters.length;i++){
		if(id === AllRouters[i].Id){
			x=1;
			if(AllRouters[i].RouterEnable == 1){
				AllRouters[i].RouterEnable = 0;
				console.log("\nRouter with Id: " + id + " is now disabled.\n");
			}else{
				console.log("\nThis router is already disabled!!\n");
			}
		}
	}
	if(x==0){
		console.log("\nRouter with this id Does not exist!! Try Again!!\n");
	}
}

function TakeInput(){
	var IdNames = util.format("Valid Networks (Ids) are:");
	for ( var s = 0 ; s < AllRouters.length ; s++ )
		IdNames = IdNames + util.format(" '%s'",AllRouters[s].Id);
	IdNames = "\n" + IdNames + "\n";
	console.log("---------------------------------------------------------------------\n",IdNames,"\n---------------------------------------------------------------------");
	console.log("\n What would you like to do? \n");
	console.log("Press C and Enter to Continue\n ");
	console.log("Press Q and Enter to quit \n");
	console.log("Press P and Enter to print the routing table for a particular router. (You will be prompted for router):\n");
	console.log("Press S and Enter to shut down a particular router. (You will be prompted for router):\n");
	console.log("Press T and Enter to start a particular router. (You will be prompted for router):\n");
	prompt.start();
	prompt.get(['input'], function (err, result) {
		var userInput = result.input;
		if(userInput === 'C' || userInput === 'c'){
			if ( ! dbg ) console.log("Working...");
			for (var x = 0 ; x < AllRouters.length ; x++ ) {
				AllRouters[x].originatePacket();
			}
			TakeInput();
		}
		else if(userInput === 'Q' || userInput === 'q'){
			if ( dbg ) {
				for (var i = 0 ; i < AllRouters.length ; i++ )
					console.log(AllRouters[i]);
			}
			console.log("\nGoodbye!!");
			return;
		}
		else if(userInput === 'P' || userInput === 'p'){
			console.log("Enter Router's id: ");
			prompt.get(['id'], function(err, result){
				var RId = result.id;
				printRoutingTable(RId);
				TakeInput();
			});
		}
		else if(userInput === 'S' || userInput === 's'){
			console.log("Enter Router's id: ");
			prompt.get(['id'], function(err, result){
				var RId = result.id;
				RouterOFF(RId);
				TakeInput();
			});
		}
		else if(userInput === 'T' || userInput === 't'){
			console.log("Enter Router's id: ");
			prompt.get(['id'], function(err, result){
				var RId = result.id;
				RouterON(RId);
				TakeInput();
			});
		}
		else{
			console.log("\nInvalid input. Try Again\n");
			TakeInput();
		}
	});
}

//////////////	Main Body Starts Here //////////////////////

var AllRouters = [];
var filestr;
var infileStream = fs.createReadStream('infile.dat');
infileStream.setEncoding('utf8');
var data = "";
var chunk;

infileStream.on('data',function(chunk) { data = data + chunk; });

infileStream.on('end',function() { 
	var linestring = "";
	var RouterID, DLRouterId, LinkCost,NetworkName, NetworkCost;
	for (var i = 0 ; i < data.length ; i++ ) {
		if ( data[i] != '\012' && data[i] != '\015' ) { //parse through line until you find a Newline or Carriage Return
			linestring = linestring + data[i];
		}
		else {
			linestring = linestring + data[i];
			if ( linestring[0] == '\040' || linestring[0] == '\011' ) {	//if first character is a space or tab -> directly-linked-router-id, link-cost
				var wordcount = 0;
				var worddata = "";
				for ( var j = 0 ; j < linestring.length ; j++ ) {
					if ( linestring[j] != " " && linestring[j] != "\n" ) {
						worddata = worddata + linestring[j];
					}
				       	else {
						wordcount = wordcount + 1;
						if ( wordcount == 2 ) {
							DLRouterId = worddata;
							worddata = "";
						}
					       	else if ( wordcount == 3 ) {
							LinkCost = worddata;
							if ( isNaN(LinkCost) || LinkCost == "") LinkCost = 1;
							worddata = "";
						}
					}
				}
				if(wordcount==2) {
					LinkCost=1;
				}
				var idx = AllRouters.length
				if ( isNaN(LinkCost) || LinkCost == "") LinkCost = 1;
				AllRouters[idx - 1].MRoutelist[DLRouterId] = parseInt(LinkCost);
				AllRouters[idx - 1].Routelist[DLRouterId] = parseInt(LinkCost);
			}
			else {
				var wordcount = 0;
				var worddata = "";
				for ( var k = 0 ; k < linestring.length ; k++ ) {
					if ( linestring[k] != " " && linestring[k] != "\n" ) {
						worddata = worddata + linestring[k];
					}
					else {
						wordcount = wordcount + 1;
						if ( wordcount == 1 ) {
							RouterId = worddata;
							worddata = "";
						}
						else if ( wordcount == 2 ) {
							NetworkName = worddata;
							worddata = "";
						}
						else if ( wordcount == 3 ) {
							NetworkCost = worddata;
							worddata = "";
						}
					}
				}
				var idx = AllRouters.length
				AllRouters[idx] = new Router(RouterId,NetworkName,NetworkCost);
			}
			linestring = "";
		}
	}
	for (var d = 0; d < AllRouters.length ; d++) {						//initialize RouteTables in each Router
		AllRouters[d].BuildRouteTable(d);
	}
	for (var d = 0; d < AllRouters.length ; d++) {						//initialize remote tick object in each router
		AllRouters[d].BuildRTickObject(d);
	}
	for (var d = 0; d < AllRouters.length ; d++) {						//initialize remote sequence number object in each router
		AllRouters[d].BuildRTseqObject(d);
	}
	if ( dbg ) {										//if debug is set, show the INITIAL state of all router objects
		for (var i = 0 ; i < AllRouters.length ; i++ )
			console.log(AllRouters[i]);
	}
	TakeInput();										//show menu
});
