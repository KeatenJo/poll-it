
var app = new Vue ({
	el: "#wrapper",
	data: {
		socket: null,
		activePoll: null,
		incommingPolls: [],
		previousPolls: [],
		upcommingPoll: null,
		pollName: "",
		candidate1Name: "",
		candidate2Name: "",	
	},

	methods: {
		connectSocket: function () {
			this.socket = new WebSocket("wss://poll-it-now.herokuapp.com/");
			this.socket.onmessage = (event) => {
				var data = JSON.parse(event.data);
				console.log(data);
				this.activePoll = data.activePoll;
				this.upcommingPoll = data.upcommingPoll;
				this.previousPolls = data.previousPolls;
			};
			this.socket.onopen = () => {
				this.activePoll = data.activePoll;
				this.upcommingPoll = data.upcommingPoll;
			};

		},
		onClickCreatePoll: function () {

			var data = {
				action: "Create-Poll",
				pollName: this.pollName,
				candidate1Name: this.candidate1Name,
				candidate2Name: this.candidate2Name,
			};
			this.socket.send(JSON.stringify(data));
			this.getPolls();
			this.pollName = "";
			this.candidate1Name = "";
			this.candidate2Name = "";
		},
		
		voteForCandidate1: function () {
			var data = {
				action: "Vote",
				candidatetoVoteFor: this.activePoll.candidate1Name,
			};
			this.socket.send(JSON.stringify(data));
			this.getPolls();
		},

		voteForCandidate2: function () {
			var data = {
				action: "Vote",
				candidatetoVoteFor: this.activePoll.candidate2Name,
			};
			this.socket.send(JSON.stringify(data));
			this.getPolls();
		},

		getPolls: function () {

			var data = { action: "request-polls" };
			this.socket.send(JSON.stringify(data));

		},
	},
	created: function () {
		this.connectSocket();
		this.getPolls();
	}
});
