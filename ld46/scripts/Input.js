class Input {
	constructor() {
		const o = this;
		o.forwardBackward = 0;
		o.leftRight 		= 0;
		o.upDown 		= 0;
		o.zoom 			= 0;
		o.lookUp 		= false;
		o.lookDown 		= false;
		o.mousePosition 	= null;
		o.keyPressed 	= false;
		o.keyInstructions = {
			'a':			'left',
			65:				'left',
			'ArrowLeft': 	'left',
			37:				'left',
			'd':			'right',
			68:				'right',
			'ArrowRight':	'right',
			39:				'right',
			'w':			'forward',
			87:				'forward',
			'ArrowUp':		'forward',
			38:				'forward',
			's':			'backward',
			83:				'backward',
			'ArrowDown':	'backward',
			40:				'backward',
			'r':			'up',
			82:				'up',
			'f':			'down',
			70:				'down',
			'e':			'lookUp',
			69:				'lookUp',
			'q':			'lookDown',
			81:				'lookDown',
			'z':			'zAction',
			90:				'zAction',
			'Enter': 'enter',
			'-': 'zoomOut',
			'=': 'zoomIn',
			'+': 'zoomIn',
			'[': 'zoomOut',
			']': 'zoomIn',
		};
		o.currentKeyInstruction = null;
		o.lastKeyInstruction = null;
		o.scrollTimeoutId = null;
		o.anyKeyDownAction = function() {};
		// o.updateCameraHorizon = function() {};
		o.zAction = function() {};
	}

	init(canvas, document) {
		canvas.onmousedown	= this.detectMouseDown.bind(this);
		canvas.onmouseup	= this.detectMouseUp.bind(this);
		canvas.onmousemove	= this.detectMouseMove.bind(this);
		canvas.ontouchstart	= this.detectMouseDown.bind(this);
		canvas.ontouchend	= this.detectMouseUp.bind(this);
		canvas.ontouchmove	= this.detectMouseMove.bind(this);
		window.addEventListener('wheel', this.detectMouseWheel.bind(this));
		document.addEventListener('keydown', this.detectKeysDown.bind(this));
		document.addEventListener('keyup', this.detectKeysUp.bind(this));
	}

	clear() {
		this.lastKeyInstruction = null;
		this.currentKeyInstruction = null;
		clearTimeout(this.scrollTimeoutId);
		this.anyKeyDownAction = () => {};
	}

	getMousePosition(e) {
		// fix for Chrome
		if (e.type.startsWith('touch')) {
			return [e.targetTouches[0].pageX, e.targetTouches[0].pageY];
		} else {
			return [e.pageX, e.pageY];
		}
	}

	detectMouseDown(e) {
		this.forwardBackward = 1.;
		this.mousePosition = this.getMousePosition(e);
		this.anyKeyDownAction();
		return;
	}

	detectMouseUp() {
		this.mousePosition = null;
		this.forwardBackward = 0;
		this.leftRight = 0;
		this.upDown = 0;
		return;
	}

	detectMouseMove(e) {
		e.preventDefault();
		if (this.mousePosition == null) { return; }
		if (this.forwardBackward == 0) { return; }

		const currentMousePosition = this.getMousePosition(e);

		this.leftRight = (this.mousePosition[0] - currentMousePosition[0]) / window.innerWidth * 2;
		this.upDown    = (this.mousePosition[1] - currentMousePosition[1]) / window.innerHeight * 10;

		// const cameraHorizon  = 100 + (this.mousePosition[1] - currentMousePosition[1]) / window.innerHeight * 500;
		// this.updateCameraHorizon(cameraHorizon);
	}

	detectMouseWheel(e) {
		this.zoom = e.deltaY / -50; // just some constant to make the zoom amount closer to 1
		clearTimeout(this.scrollTimeoutId);
		this.scrollTimeoutId = setTimeout(() => {
			this.zoom = 0;
		}, 20);
	}

	getEventKeyInstruction(e) {
		const key = e.key || e.keyCode;
		// console.log('Key hit:', key);
		const instruction = this.keyInstructions[key] || key;
		return instruction;	
	}

	detectKeysDown(e) {
		const k = this.getEventKeyInstruction(e);
		this.keyPressed = true;
		this.currentKeyInstruction = k;
		this.lastKeyInstruction = k;
		switch(k) {
			case 'left':
				this.leftRight = +1.;
				break;
			case 'right':
				this.leftRight = -1.;
				break;
			case 'forward':
				this.forwardBackward = 1.;
				break;
			case 'backward':
				this.forwardBackward = -1.;
				break;
			case 'up':
				this.upDown = +1.;
				break;
			case 'down':
				this.upDown = -1.;
				break;
			case 'lookUp':
				this.lookUp = true;
				break;
			case 'lookDown':
				this.lookDown = true;
				break;
			case 'zoomIn':
				this.zoom = 1;
				break;
			case 'zoomOut':
				this.zoom = -1;
				break;
			case 'enter':
				break;
			default:
				return;
				break;
		}
		this.anyKeyDownAction();
		e.preventDefault();
		return false;
	}

	detectKeysUp(e) {
		const k = this.getEventKeyInstruction(e);
		this.currentKeyInstruction = null;
		switch(k) {
			case 'left':
			case 'right':
				this.leftRight = 0;
				break;
			case 'forward':
			case 'backward':
				this.forwardBackward = 0;
				break;
			case 'up':
			case 'down':
				this.upDown = 0;
				break;
			case 'lookUp':
				this.lookUp = false;
				break;
			case 'lookDown':
				this.lookDown = false;
				break;
			case 'zoomIn':
			case 'zoomOut':
				this.zoom = 0;
				break;
			case 'zAction':
				this.zAction();
			default:
				return;
				break;
		}
		return false;
	}
}

export default Input;