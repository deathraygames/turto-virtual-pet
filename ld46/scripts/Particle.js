import decayer from './decayer.js';
import physics from './physics.js';
import CompositePolygon from './CompositePolygon.js';
import XY from './XY.js';

class Particle extends CompositePolygon {
	constructor({ x, y}, polygonArray = []) {
		super({ puff: polygonArray});
		Object.assign(
			this,
			physics.canCollide(this),
			physics.canMove(this),
			decayer.canDecay(this)
		);
		this.pos = new XY(x, y);
		// this.compositePolygon = new CompositePolygon({ puff: polygonArray }, 'particle');
	}
}

export default Particle;
