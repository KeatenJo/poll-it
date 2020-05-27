const WebSocket = require('ws');
const express = require('express');

var app = express();
app.set('port', (process.env.PORT || 8080));

// middlewares
app.use(express.static('public'));

var server = app.listen(app.get('port'), function () {
  console.log("Server listening...");
});



const wss = new WebSocket.Server({ server: server });

previousPolls = [];
activePoll = null;
upcommingPoll = null;
/*var poll = {
 * name: "String",
 * candiate1Name: "String",
 * candidate2Name: "String",
 * candidate1Votes: int,
 * candidate2Votes: int,
 * totalVotes: int
 *
 * }
 * */
class Queue {
	constructor() { 
		this.items = []; 	
	} 
	enqueue(item) {
		this.items.push(item);
	};

	dequeue() { 
		if(this.isEmpty()) {
			return "Nothing to Dequeue. Queue is empty."; 
		} else {
			return this.items.shift(); 
		} 
	};

	front() {
		if(this.isEmpty()) {
			return "Queue is empty."; 
		} else {
			return this.items[0]; 
		}
	};

	isEmpty() {
		return this.items.length == 0; 
	};

};

var pollQueue = new Queue();

var endActivePollStartNewPoll = function () {
	if(activePoll == null && upcommingPoll == null && pollQueue.isEmpty() == true) {
		// do nothing broadcast currently active polls

	} else if (activePoll !=null && upcommingPoll == null && pollQueue.isEmpty() == true) {
		previousPolls.push(activePoll);
		activePoll = null;

	} else if (activePoll !=null && upcommingPoll == null && pollQueue.isEmpty() == false) {
		activePoll = pollQueue.front();
		previousPolls.push(activePoll);

	} else if(activePoll != null && upcommingPoll != null && pollQueue.isEmpty() == false) {
		previousPolls.push(activePoll);
		activePoll = upcommingPoll;
		upcommingPoll = pollQueue.front();
		pollQueue.dequeue();

	} else if(activePoll != null && upcommingPoll != null && pollQueue.isEmpty() == true) {
		previousPolls.push(activePoll);
		activePoll = upcommingPoll;
		upcommingPoll = null;
	} else {
		// really shouldn't be here
		console.log(upcommingPoll);
		console.log(activePoll);
		//Debug Statements
	}

	var broadCastMessage = {
		evt: "poll-state-change",
		action: "active-poll-change",
		activePoll: activePoll,
		upcommingPoll: upcommingPoll,
		previousPolls: previousPolls,

	};

	wss.clients.forEach(function(oneClient) {
		oneClient.send(JSON.stringify(broadCastMessage));
	});
};


wss.on('connection', function (wsclient) {
	clientMessage = {
		activePoll: activePoll,
		upcommingPoll: upcommingPoll,
		previousPolls: previousPolls,

	};
	wsclient.send(JSON.stringify(clientMessage));

	wsclient.on('message', function(message) {
		var data = JSON.parse(message);
		
		if(data.action && data.action == "Create-Poll"){
			var poll = {
				name: data.pollName,
				candidate1Name: data.candidate1Name,
				candidate2Name: data.candidate2Name,
				candidate1Votes: 0,
				candidate2Votes: 0,
				totalVotes: 0,
			};
			
			// no active or upcomming poll
			if(activePoll == null && upcommingPoll == null) {
				activePoll = poll;
			// Active poll but no upcomming poll
			} else if (activePoll != null && upcommingPoll == null && pollQueue.isEmpty() == true) {
				upcommingPoll = poll;
			// Active poll and upcoming poll so enqueue
			} else {
				console.log("enqueue");
				pollQueue.enqueue(poll);
			}
			//Debug Statement
			console.log(poll);
			console.log(pollQueue);
			console.log(activePoll);

		} else if(data.action && data.action == "Vote") {
			var candidatetoVoteFor = data.candidatetoVoteFor;
			if(activePoll.candidate1Name == candidatetoVoteFor) {
				activePoll.candidate1Votes += 1;
				activePoll.totalVotes += 1;
			} else {
				activePoll.candidate2Votes += 1;
				activePoll.totalVotes += 1;	
			}

			var broadcastMessage = {
				evt: "poll-state-change",
				action: "vote",
				activePoll: activePoll,
				upcommingPoll: upcommingPoll,
				previousPolls: previousPolls,
			};
			

			wss.clients.forEach(function (oneClient) {
				oneClient.send(JSON.stringify(broadcastMessage));
			});

		} else if(data.action && data.action == "request-polls") {

			var broadcastMessage = {
				evt: "poll-state-not-changed",
				action: "give-polls-from-server",
				activePoll: activePoll,
				upcommingPoll: upcommingPoll,	
				previousPolls: previousPolls,
			};
			

			wss.clients.forEach(function (oneClient) {
				oneClient.send(JSON.stringify(broadcastMessage));
			});

		}

	});
});
	setInterval(endActivePollStartNewPoll, 30000);




