class Loop {
	constructor(fn) {
		this.lastLoopTime = 0;
		this.continueLoop = true;
		this.looper = (typeof fn === 'function') ? fn : () => {};
		this.timeScale = 1;
		this.tick = 0;
	}
	start() {
		this.lastLoopTime = performance.now();
		this.continueLoop = true;
		this.loopOnNextFrame();
	}
	setup(fn) {
		this.looper = fn;
		return this;
	}
	loopOnNextFrame() {
		if (!this.continueLoop) { return; }
		window.requestAnimationFrame((now) => { this.loop(now); });
	}
	loop(now) {
		if (!this.continueLoop) { return; }
		const deltaT = ((now - this.lastLoopTime) / 1000) * this.timeScale;
		if (this.tick >= Number.MAX_SAFE_INTEGER) {
			this.tick = 0;
		} else {
			this.tick += 1;
		}
		const returnStop = this.looper(deltaT, this.tick, now);
		this.lastLoopTime = now;
		this.continueLoop = (returnStop) ? false : true;
		this.loopOnNextFrame();
	}
	contiue() {
		this.continueLoop = true;
	}
	stop() {
		this.continueLoop = false;
	}
	toggle() {
		if (this.isLooping()) { return this.stop(); }
		return this.start();
	}
	isLooping() {
		return this.continueLoop;
	}
	changeTimeScale(a = 1) {
		this.timeScale = a;
	}
}

export default Loop;