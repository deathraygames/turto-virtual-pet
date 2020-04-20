import XY from './XY.js';

const BIG_G_DEFAULT = 5.;
const MIN_GRAVITY_RADIUS = 1;

function physics(objects, t) {
	// Loop through objects, apply gravity
	objects.forEach((obj) => {
		if (!(obj.pos instanceof XY)) { return; }
		if (obj.collide) {
			obj.collide(objects);
		}
		if (obj.gravitate) {
			obj.gravitate(t, objects);
		}
		if (obj.move) {
			obj.move(t);
		}
		// obj.y += 0.01 * t;
	});
}

physics.getOrbitalVelocity = function (smallObject, bigObject, left = false, bigG = BIG_G_DEFAULT) {
	// const m = smallObject.mass;
	const M = bigObject.mass;
	const r = smallObject.pos.getDistance(bigObject.pos);
	const speed = Math.sqrt( bigG * M / r );
	const unit = smallObject.pos.getUnitVector(bigObject.pos);
	const v = unit.getPerpendicularVector(left).multiply(speed);
	console.log(arguments, M, r, speed, unit, v);
	return v;
};

physics.canCollide = (o) => ({
	colliding: [],
	collide(objs) {
		const innerRadius = (typeof o.innerRadius === 'number') ? o.innerRadius : 0;
		o.isColliding = false;
		o.colliding.length = 0;
		const pushBack = (b, amount) => {
			const pusher = (o.mass > b.mass) ? o : b;
			const pushee = (pusher === o) ? b : o;
			const push = pushee.pos.getUnitVector(pusher.pos).multiply(amount);
			pushee.pos.add(push);
		};
		const doDamage = (m, objHit) => {
			if (m < 1) { return; }
			// (trial and error damage)
			const velocityDamage = Math.ceil(Math.pow(m, 1.4) / 10);
			// console.log('Damage', m, '-->', velocityDamage);
			if (o.damage) {
				o.damage(velocityDamage, objHit);
			}
		};
		objs.forEach((b) => {
			if (o === b || !(b.pos instanceof XY && b.vel instanceof XY)) {
				return false;
			}
			const r = o.pos.getDistance(b.pos);
			const innerRadiusB = (typeof b.innerRadius === 'number') ? b.innerRadius : 0;
			const edgeToEdgeDistance = r - innerRadius - innerRadiusB;
			if (edgeToEdgeDistance > 0) {
				return false;
			}
			o.colliding.push(b);
			// Push back to avoid overlaps
			// const pushAmount = edgeToEdgeDistance;
			// pushBack(b, pushAmount);

			// Bounce
			// TODO: bounce ... see setNewCollisionVels

			// Damage
			const relativeVelocity = o.vel.clone().add(b.vel);
			const velocityMag = relativeVelocity.getMagnitude();
			doDamage(velocityMag, b);
			return true;
		});
		o.isColliding = o.colliding.length > 0;
		if (o.isColliding) {
			o.vel.multiply(0.7);
		}
	}
});

physics.canMove = (o) => ({
	pos: new XY(),
	force: new XY(),
	acc: new XY(),
	vel: new XY(),
	move(t) {
		const forceAcc = new XY((o.force.x / o.mass), (o.force.y / o.mass));
		o.acc.add(forceAcc);
		const deltaVel = o.acc.getMultiply(t); // new XY(o.acc.x * t, o.acc.y * t);
		o.vel.add(deltaVel);
		const deltaPos = o.vel.getMultiply(t/2); // new XY(o.vel.x * t / 2, o.vel.y * t / 2);
		o.pos.add(deltaPos);
		// clear because ongoing forces need to be re-applied
		o.force.clear();
		o.acc.clear();
		// Sync base x,y if they exist
		// if (o.x !== undefined) { o.x = o.pos.x; }
		// if (o.y !== undefined) { o.y = o.pos.y; }
	}
});

physics.canGravitate = (o, bigG = BIG_G_DEFAULT) => ({
	gravitate(t, objs) {
		if (o.mass === 0) { return false; }
		const bigGMass = bigG * o.mass;
		objs.forEach((b) => { return o.gravitateOne(b, bigGMass); });
		// o.force.add(new XY(0,0.0001));
	},
	gravitateOne(b, bigGMass) { // Apply force of gravity due to one object
		if (
			b === o // can't get gravity from self
			|| b.mass === 0 || o.mass === 0 // things without mass don't make gravity
			|| o.isColliding // collisions cancel gravity with normal force
			|| !(b.pos instanceof XY)
		) {
			return false;
		}
		const r = o.pos.getDistance(b.pos);
		// Last resort to prevent black holes or super flinging
		if (r < MIN_GRAVITY_RADIUS) {
			// o.vel.multiply(0.2);
			return false; 
		}
	
		// F = G (m1 m2) / r^2
		// See http://en.wikipedia.org/wiki/Newton's_law_of_universal_gravitation#Vector_form            
		//console.log("Forces on", this.name, " due to ", b.name);
		const unit = o.pos.getUnitVector(b.pos);
		//console.log("unit vector", JSON.stringify(rv));
		
		const rSquared = Math.pow(r, 2);
		const forceMagnitude = (rSquared == 0) ? 0 : ((bigGMass * b.mass)/rSquared);
		const forceOfGravity = unit.getMultiply(forceMagnitude);
		o.force.add(forceOfGravity);		
		// console.log(o.name, o.pos, b.pos, rSquared, forceMagnitude);
		return true;
	}
});

physics.physical = (o) => {
	Object.assign(
		o,
		{
			mass: 1,
			// pos: new XY(),
			// force: new XY(),
			// acc: new XY(),
			// vel: new XY(),
			// colliding: [],
		},
		physics.canCollide(o),
		physics.canMove(o),
		physics.canGravitate(o, BIG_G_DEFAULT),
	);
	return o;
};

export default physics;
