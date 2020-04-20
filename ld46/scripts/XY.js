class XY {
	constructor(x = 0, y = 0) {
		this.x = x;
		this.y = y;
	}
	set({x, y}) {
		this.x = x || 0;
		this.y = y || 0;
		return this;
	}
	add({x, y}) {
		this.x += x || 0;
		this.y += y || 0;
		return this;
	}
	subtract({x, y}) {
		this.x -= x || 0;
		this.y -= y || 0;
		return this;
	}
	multiply(m) {
		this.x *= m || 1;
		this.y *= m || 1;
		return this;
	}
	reverse() {
		return this.multiply(-1);
	}
	getDistance({x, y}) {
		return Math.sqrt( Math.pow((this.x - x), 2) + Math.pow((this.y - y), 2) );
	}
	getUnitVector(xy) {
		let {x,y} = xy;
		const d = Math.abs(this.getDistance(xy));
		if (d === 0) { return new XY(0, 0); }
		const dx = x - this.x;
		const dy = y - this.y;
		x = dx / d;
		y = dy / d;
		return new XY(x, y);
	}
	getPerpendicularVector(left = false) {
		return (left) ? new XY(-1 * this.y, this.x) : new XY(this.y, -1 * this.x);
	}
	getMagnitude() {
		return Math.sqrt( Math.pow(this.x, 2) + Math.pow(this.y, 2)	);
	}
	getMultiply(m) {
		return new XY(this.x * m, this.y * m);
	}
	clone() {
		return new XY(this.x, this.y);
	}
	clear() {
		this.x = 0;
		this.y = 0;
	}
}

export default XY;
