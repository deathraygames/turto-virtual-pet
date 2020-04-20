
const NAMES = ['Egg', 'Baby', 'Child', 'Teen', 'Adult', 'Senior', 'Ancient'];
const LIFECYCLE_LENGTH = [5, 60, 120, 120, 240, 240, 360];
const SCALE = [0.1, 0.1, 0.3, 0.55, 0.7, 0.7, 0.6];

function findLifecycleIndex(t) {
	let cutoff = 0;
	let i;
	for(i = 0; i < LIFECYCLE_LENGTH.length; i++) {
		cutoff += LIFECYCLE_LENGTH[i];
		if (cutoff > t) {
			return i;
		}
	}
	return LIFECYCLE_LENGTH.length - 1;
}

class MonsterAge {
	constructor(t) {
		this.t = t;
		this.i = 0;
	}
	getName() {
		return NAMES[this.i];
	}
	getLifecycleIndex() {
		return this.i;
	}
	setLifecycleIndex(t) {
		this.i = findLifecycleIndex(t);
	}
	increment(t) {
		this.t += t;
		this.setLifecycleIndex(this.t);
	}
	getScaleMultiplier() {
		return SCALE[this.i];
	}
	isEgg() {
		return this.i === 0;
	}
	isSenior() {
		return this.i === 5;
	}
}

export default MonsterAge;
