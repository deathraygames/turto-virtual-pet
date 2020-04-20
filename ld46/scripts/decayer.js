
function decayer() {

};

decayer.canDecay = (o) => ({
	decayLife: 2.,
	decay: (t) => {
		o.decayLife -= t;
		return (o.decayLife <= 0);
	}
});

export default decayer;
