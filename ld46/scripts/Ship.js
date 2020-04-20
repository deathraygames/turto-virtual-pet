import CompositePolygon from './CompositePolygon.js';
import XY from './XY.js';
import Particle from './Particle.js';

class Ship extends CompositePolygon {
	constructor(parts = {}, {exhaustX, exhaustY}) {
		super(parts);
		this.health = 100;
		this.fuel = 500;
		this.thrustMagnitude = 100000;
		this.trail = [];
		this.maxTrailLength = 500;
		this.exhaustPoint = new XY(exhaustX || 0, exhaustY || 0);
		this.armor = 2;
	}
	damage(n, objHit) {
		if (objHit && objHit.mass > this.armor) {
			this.health -= n;
		}
		if (this.dead()) {
			this.mangleParts();
		}
	}
	mangleParts() {
		this.parts.forEach((p) => {
			for(let i = 0; i < p.arr.length; i++) {
				p.arr[i] += this.getRandomBell(6);
			}
		});
	}
	dead() {
		return this.health <= 0;
	}
	getRandomBell(n) {
		return (Math.random() * n) - (Math.random() * n);
	}
	getAlertLevel() {
		if (this.dead()) { return 'red'; }
		return '';
	}
	getFacingUnitVector(rotOffset = 0) {
		const radians = (this.rotation - 90 + rotOffset) * Math.PI / 180;
		const x = Math.cos(radians);
		const y = Math.sin(radians);
		return new XY(x, y);
	}
	getExhaustParticle() {
		const rearUnitVector = this.getFacingUnitVector(this.getRandomBell(20)).reverse();
		const rearOffset = rearUnitVector.multiply(50); // TODO: fix
		const currentExhaustPoint = this.pos.clone().add(rearOffset);
		// currentExhaustPoint.x += this.getRandomBell(10);
		// currentExhaustPoint.y += this.getRandomBell(10);

		// const currentExhaustPoint = this.exhaustPoint.clone().add(this.pos).add({x: 100, y: 100});
		const p = new Particle(currentExhaustPoint, [0,0, 2,2, 1,1]);
		p.rotation = Math.random() * 360;
		const exhaustVelUnitVector = rearUnitVector; // this.getFacingUnitVector(Math.random() * 90).reverse();
		p.vel.set(exhaustVelUnitVector.multiply(10));
		// p.vel.x += (Math.random() * 40) - (Math.random() * 40);
		// p.vel.y += (Math.random() * 40) - (Math.random() * 40);
		// console.log(p.vel);
		p.mass = 1;
		p.decayLife = 1. + this.getRandomBell(4);
		return p;		
	}
	spin(theta) {
		if (this.isColliding) {
			theta = theta / 5;
			this.damage(1);
		}
		return this.rotate(theta);
	}
	thrust(n) {
		if (this.fuel < n || this.dead()) {
			return false;
		}
		const unit = this.getFacingUnitVector();
		const thrustForce = unit.getMultiply(n * this.thrustMagnitude);
		this.fuel -= n;
		if (this.mass) {
			this.mass -= n;
		}
		// console.log(thrustForce.getMagnitude());
		this.force.add(thrustForce);
		if (this.pos instanceof XY) {
			return [this.getExhaustParticle()];
		}
		return [];
	}
	appendTrail() {
		if (this.pos instanceof XY) {
			this.trail.unshift(this.pos.clone());
		}
		if (this.trail.length > this.maxTrailLength) {
			this.trail.pop();
		}
	}
}

export default Ship;
