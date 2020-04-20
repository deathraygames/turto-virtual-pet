// import CompositePolygon from './CompositePolygon.js';
import MonsterAge from './MonsterAge.js';
import XY from './XY.js';

const HALF_PI = Math.PI / 2;

const EAT = 1;
const COME = 2;
const SIT = 3;
const SLEEP = 4;
const NO_ACTION = null;
const NO_TARGET = null;

//---------- Methods

// TODO: move
function getPolygonSvg(classNames, fill, polygon) {
	return `<polygon class="${classNames}" points="${polygon.getPointsString()}" fill="${fill}" />`;
}

function getPolyLineSvg(arr, classNames) {
	return `<polyline class="${classNames}" points="${getPointsString(arr)}" />`;
}

function getPointsString(arr) {
	return arr.map((point) => { return `${point.x + offset.x} ${point.y + offset.y}`; }).join(', ');
}

function randomInt(n) {
	return Math.floor(Math.random() * n) + 1;
}

function getTransformStyle(offset = {}, pos = {}, halfSize = {}, scale = 1, rotation = 0) {
	let {x,y} = pos;
	if (offset.x) { x += offset.x; }
	if (offset.y) { y += offset.y; }
	x -= (halfSize.x * scale);
	y -= (halfSize.y * scale);
	return `translate(${x},${y}) rotate(${rotation} ${halfSize.x} ${halfSize.y})`;
}

function getNearestFood(items) {
	items.sort((a, b) => {
		const happyDiff = (b.happyValue - a.happyValue);
		// TODO: look for proximity?
		return happyDiff;
	});
	return items[0];
}

//---------- Status

const STATUS_LEVEL_GOOD = 0;
const STATUS_LEVEL_NEUTRAL = 1;
const STATUS_LEVEL_ALERT = 2;
const STATUS_LEVEL_WARNING = 3;
const STATUS_LEVEL_CRITICAL = 4;
const STATUS_CLASSES = [
	'status-good', 'status-neutral', 'status-alert', 'status-warning', 'status-critical'
];

class MonsterStatus {
	constructor(name, level) {
		this.name = name;
		this.level = level;
	}
	getName() {
		if (this.level === STATUS_LEVEL_CRITICAL) {
			return this.name.toUpperCase() + '!';
		}
		return this.name;
	}
	getHtml(tag) {
		const className = STATUS_CLASSES[this.level];
		return `<${tag} class="${className}">${this.getName()}</${tag}>`;
	}
}


class Monster {
	constructor() {
		// this.compPoly = new CompositePolygon({ 
		// 	chunk: [
		// 		50,50, 150,0, 250,50, 
		// 		300,150, 
		// 		250,250, 150,300, 50,250,
		// 		0,150
		// 	]
		// });
		this.color = {
			r: randomInt(150) + 50,
			g: randomInt(150) + 70,
			b: randomInt(150) + 50
		};
		this.headColor = {
			r: this.color.r + 10,
			g: this.color.g + 10,
			b: this.color.b + 10
		};
		this.irisColor = {
			r: randomInt(150), 
			g: randomInt(150),
			b: randomInt(150)
		};
		this.shellColor = {
			r: 50 + Math.round(this.color.r/10),
			g: 55 + Math.round(this.color.g/10),
			b: 55 + Math.round(this.color.b/10)
		};
		this.stomachColor = {
			r: 50 + Math.round(this.color.r/8),
			g: 55 + Math.round(this.color.g/8),
			b: 55 + Math.round(this.color.b/8)
		};
		this.age = new MonsterAge(0);
		this.maxHappiness = 100;
		this.happiness = this.maxHappiness;
		this.boredomRate = 1;
		this.maxHunger = 100;
		this.hunger = 0;
		this.hungerRate = 2;
		this.bowels = 0;
		this.digestionCooldown = 0;
		this.maxHealth = 100;
		this.health = this.maxHealth;
		this.sickness = 0;
		this.vaccination = 0;
		this.maxVaccination = 100;
		this.maxEnergy = 100;
		this.energy = this.maxEnergy;

		this.pos = new XY(0, 0);
		this.targetPos = NO_TARGET; // new XY(0, 0);
		this.speed = 160; // pixels per second
		this.newTargetHeatup = 0;
		this.eatingRange = 30;
		this.eatingTime = 2;

		this.actionCooldown = 0;
		this.action = NO_ACTION;
		this.actionTarget = NO_TARGET;
		this.turn = 0;

		this.rotation = 0;
		this.bopT = 0;
		this.squish = 0;
		this.breathT = 0;
		this.breathOffset = 0;
		this.leftWalkOffset = 0;
		this.rightWalkOffset = 0;
		this.blinkTime = 0.5;
		this.blinkOpenTime = 4;
		this.blinkCooldown = this.blinkTime;
		this.eyeOpen = true;
		this.eyeOpenAmount = 1;

		this.scale = this.age.getScaleMultiplier();
		this.size = new XY(300, 300);
		this.halfSize = this.size.getMultiply(0.5);
		this.maxMouthWidth = 40 + randomInt(200);
		this.mouthWidth = this.maxMouthWidth;
		this.mouthT = 0;
		this.maxMouthHeight = 40 + randomInt(30);
		this.mouthHeight = this.maxMouthHeight;
		this.maxEyeHeight = 60;

		this.lastChanceOfSickness = 0;
	}

	getStatuses() {
		const statuses = [];
		function addStatus(name, level) {
			statuses.push(new MonsterStatus(name, level));
		}
		if (this.dead()) {
			addStatus('Dead', STATUS_LEVEL_CRITICAL);
		} else {
			if (this.action === EAT) {
				addStatus('Eating', STATUS_LEVEL_NEUTRAL);
			}
			if (this.action === COME) {
				addStatus('Following', STATUS_LEVEL_NEUTRAL);
			}
			if (this.action === SIT) {
				addStatus('Sitting', STATUS_LEVEL_NEUTRAL);
			}
			if (this.action === SLEEP) {
				addStatus('Sleeping', STATUS_LEVEL_NEUTRAL);
			}
		}
		const hungerName = (this.hungry()) ? 'Hungy' : 'Full';
		addStatus(hungerName, this.getStatusLevel(this.hunger, this.maxHunger, -1));
		const healthName = (this.unhealthy()) ? 'Unhealthy' : 'Healthy';
		addStatus(healthName, this.getStatusLevel(this.health, this.maxHealth, 1));
		const happinessName = (this.happy()) ? 'Happy' : ((this.unhappy()) ? 'Unhappy' : 'Content');
		addStatus(happinessName, this.getStatusLevel(this.happiness, this.maxHappiness, 1));
		const energyName = (this.tired()) ? 'Tired' : 'Rested';
		addStatus(energyName, this.getStatusLevel(this.energy, this.maxEnergy, 1));
		if (this.sick()) {
			addStatus('Sick', (this.sickness > 50) ? STATUS_LEVEL_CRITICAL : STATUS_LEVEL_WARNING);
		}
		return statuses;
	}

	getAge() {
		return Math.round(this.age.t);
	}
	getLifecycleName() {
		return this.age.getName();
	}

	getStatusLevel(value, max, direction) {
		if (direction > 0) {
			if (value < (max * (1/2))) {
				let level = STATUS_LEVEL_ALERT;
				if (value < (max * (3/4))) {
					level = STATUS_LEVEL_WARNING;
					if (value < (max * (7/8))) {
						level = STATUS_LEVEL_CRITICAL;
					}
				}
				return level;
			} else if (value > (max * (1/7))) {
				return STATUS_LEVEL_GOOD;
			}
		} else {
			if (value > (max * (1/2))) {
				let level = STATUS_LEVEL_ALERT;
				if (value > (max * (3/4))) {
					level = STATUS_LEVEL_WARNING;
					if (value > (max * (7/8))) {
						level = STATUS_LEVEL_CRITICAL;
					}
				}
				return level;
			} else if (value < (max * (1/7))) {
				return STATUS_LEVEL_GOOD;
			}
		}
		return STATUS_LEVEL_NEUTRAL;
	}

	dead() {
		return this.health <= 0;
	}

	damage(amount = 1) {
		return this.addHealth(-amount);
	}
	addHealth(amount = 1) {
		const ogHealth = this.health;
		this.health = Math.min(Math.max(0, this.health + amount), this.maxHealth);
		return this.health - ogHealth;
	}

	addHunger(amount = 1) {
		const ogHunger = this.hunger;
		this.hunger = Math.min(Math.max(0, this.hunger + amount), this.maxHunger);
		return this.hunger - ogHunger;
	}
	addHappiness(amount = 1) {
		const ogHappiness = this.happiness;
		this.happiness = Math.min(Math.max(0, this.happiness + amount), this.maxHappiness);
		return this.happiness - ogHappiness;
	}
	addSickness(amount = 0) {
		const ogSickness = this.sickness;
		this.sickness = Math.max(0, this.sickness + amount);
		return this.sickness - ogSickness;		
	}
	addVaccination(amount = 0) {
		const og = this.vaccination;
		this.vaccination = Math.min(Math.max(0, this.vaccination + amount), this.maxVaccination);
		return this.vaccination - og;		
	}
	addEnergy(amount = 1) {
		const og = this.energy;
		this.energy = Math.min(Math.max(0, this.energy + amount), this.maxEnergy);
		return this.energy - og;
	}

	couldEat() {
		return (this.hunger > (this.maxHunger * (1/4)));
	}
	hungry() {
		return (this.hunger > (this.maxHunger * (1/2)));
	}

	sick() {
		return (this.sickness > 0);
	}

	unhealthy() {
		return (this.health < (this.maxHealth * (1/2)));
	}

	tired() {
		return (this.energy < (this.maxEnergy * 0.5));
	}

	unhappy() {
		return this.happiness <= 40;
	}

	happy() {
		return this.happiness >= 60;
	}

	come(pos) {
		this.setTargetPos(pos);
		this.setAction(COME, NO_TARGET, 5);
	}

	sit() {
		this.clearTarget();
		this.setAction(SIT, NO_TARGET, 5);
		this.leftWalkOffset = -1;
		this.rightWalkOffset = -1;
	}

	pet() {
		this.addHappiness(10);
	}

	vaccinate() {
		this.addHappiness(-100);
		this.addSickness(-1);
		this.addVaccination(40);
	}

	wantToPlanNewTarget(t) {
		const think = randomInt(1000);
		// console.log(think, this.newTargetHeatup);
		return (think + this.newTargetHeatup > 990); // TODO: add t to this calc
	}

	planRandomTarget(worldSize, t) {
		if (!this.wantToPlanNewTarget(t)) {
			this.newTargetHeatup += t;
			return false;
		}
		// console.log('planning movement', this.newTargetHeatup);
		this.newTargetHeatup = 0;
		this.assignRandomTarget(worldSize);
		// console.log('to target', this.targetPos);
	}

	setTargetPos({x, y}) {
		this.turn = (x < this.pos.x) ? -1 : 1;
		this.targetPos = new XY(x, y);
	}

	clearTarget() {
		this.targetPos = NO_TARGET;
	}

	assignRandomTarget(worldSize) {
		this.setTargetPos({x: randomInt(worldSize.x), y: randomInt(worldSize.y)});
	}

	planToEat(items) {
		if (items.length <= 0) { return; }
		const food = getNearestFood(items);
		if (!food) { return false; }
		this.setTargetPos(food.pos);
		return true;
	}

	advance(t, tick, worldSize, items, command, world) {
		if (t < 0) { console.warn('t < 0', t); return; }
		if (this.dead()) { return false; }
		if (this.age.isEgg()) {
			this.bop(t);
		} else {
			if (tick % 2 === 0 && !this.action) {
				this.think(t, worldSize, items, command, world);
			}
			this.move(t);
			this.act(t, items, command);
			this.environment(t, tick, items);
			this.blink(t);
		}
		this.breathe(t);
		this.ageOlder(t);
	}

	breathe(t) {
		this.breathT += t;
		this.breathOffset = Math.sin(this.breathT * 2) * 8;
	}

	blink(t = 0) {
		const asleep = (this.action === SLEEP);
		this.blinkCooldown -= t;
		if (this.blinkCooldown <= 0) {
			this.eyeOpen = !this.eyeOpen;
			this.blinkCooldown = (this.eyeOpen) ? this.blinkOpenTime + randomInt(2) : this.blinkTime;
		}
		const eyeOpenGoal = (asleep) ? 0 : ((this.eyeOpen) ? 1 : 0);
		this.eyeOpenAmount += ((eyeOpenGoal - this.eyeOpenAmount) / 2);
	}

	think(t, worldSize, items, command, world) {
		// Eat
		const food = getNearestFood(items);
		const inFoodRange = (food && this.pos.getDistance(food.pos) <= this.eatingRange);
		if (inFoodRange && !this.action) {
			this.setAction(EAT, food, this.eatingTime);
			return;
		}
		// Bedtime
		if (this.action === SLEEP && this.energy === this.maxEnergy) {
			this.clearAction();
		}
		if (this.energy === 0 && !world.isLightsOn) {
			this.setAction(SLEEP, NO_TARGET, 30);
			return;
		}
		// Hunt
		if (this.couldEat()) {
			if (this.planToEat(items)) { return; }
		}
		this.planRandomTarget(worldSize, t);
	}

	act(t, items, command) {
		if (this.action === EAT) {
			this.chew(t);
			this.eat(t, this.actionTarget, items);
			this.removeItem(this.actionTarget, items);
		} else if (this.action === SLEEP) {
			this.addEnergy(t * 5);
		}
		if (this.action) {
			this.cooldownAction(t);
		}
		if (this.actionCooldown <= 0) {
			this.action = NO_ACTION;
			this.actionTarget = NO_TARGET;
		}
	}

	setAction(actionType = NO_ACTION, target = NO_TARGET, cooldown = 0) {
		this.action = actionType;
		this.actionTarget = target;
		this.actionCooldown = cooldown;
	}

	clearAction() {
		this.setAction(NO_ACTION, NO_TARGET, 0);
	}

	cooldownAction(t) {
		this.actionCooldown = Math.max(0, this.actionCooldown - t);
		if (this.actionCooldown <= 0) {
			this.action = NO_ACTION;
		}
	}

	removeItem(item, items) {
		if (!item) { return false; }
		const i = items.findIndex((thisItem) => { return (item === thisItem); });
		if (i === -1) { console.warning('no item found to remove'); }
		items.splice(i, 1);
		if (this.actionTarget === item) {
			this.actionTarget = NO_TARGET;
		}
	}

	eat(t, food, items) {
		if (!food) { return false; }
		this.addHunger(-food.foodValue);
		this.addHealth(Math.round(food.foodValue / 10) + food.medicalValue);
		this.addHappiness(food.happyValue);
		let toxicity = food.contagion;
		if (food.contagion > 0 && this.vaccination > 0) {
			toxicity = 0;
			this.addVaccination(-50);
		}
		this.addSickness(toxicity - food.medicalValue);
		this.bowels += food.foodValue + Math.abs(food.happyValue);
		this.digestionCooldown += 2;
	}

	chew(t) {
		this.turn = 0;
		this.mouthT += (t * 8);
		this.mouthHeight = ((Math.sin(this.mouthT) + 1) / 2) * this.maxMouthHeight;
	}

	environment(t, tick, items = []) {
		if (tick % 60 !== 0) { return; } // TODO: use cooldown
		const contagions = items.reduce((sum, item) => { return sum + item.contagion; }, 0);
		// if (contagions <= 0) { return; }
		let chanceOfSickness = (this.age.isSenior()) ? 8 : 1;
		const depression = (this.unhappy()) ? 2 : 1;
		chanceOfSickness = Math.min((chanceOfSickness * depression) + contagions, 100);
		if (this.action === SLEEP) {
			chanceOfSickness = (chanceOfSickness / 2);
		}
		const roll = randomInt(100);
		// console.log(chanceOfSickness, '%', contagions, 'roll:', roll);
		if (roll <= chanceOfSickness) {
			if (this.vaccination > 0) {
				this.addVaccination(-50);
			} else {
				this.addSickness(1);
			}
		}
		this.lastChanceOfSickness = chanceOfSickness;
	}

	ageOlder(t) {
		this.age.increment(t);
		this.hunger = Math.min(this.hunger + (this.hungerRate * t), this.maxHunger);
		const isStarving = (this.hunger >= this.maxHunger);
		if (this.sick() || isStarving) {
			const sickDamage = t * 0.1;
			const starveDamage = t * 2;
			this.addHappiness(-t);
			this.addHealth(-1 * (sickDamage + starveDamage));
		} else {
			const multiplier = (this.age.isSenior()) ? 0.1 : 1;
			this.addHealth(t * multiplier);
			this.grow(t);
		}
		this.addHappiness(-1 * (this.boredomRate * t));
		this.addEnergy(-1 * t);
	}

	grow(t) {
		const desiredScale = this.age.getScaleMultiplier();
		if (this.scale === desiredScale) { return; }
		const diff = desiredScale - this.scale;
		// console.log(desiredScale, this.scale, diff);
		if (diff < 0.001) {
			this.scale = desiredScale;
			return;
		}
		this.scale += ((diff / 2) * t);
	}

	poop(t) {
		const poopThreshold = this.maxHunger / 2;
		const digestionRate = 1;
		this.digestionCooldown = Math.max(0, this.digestionCooldown - (digestionRate * t));
		const poopin = (this.bowels > poopThreshold && this.digestionCooldown === 0);
		if (poopin) {
			this.digestionCooldown = 10;
			this.bowels -= poopThreshold;
			if (this.dead()) {
				this.bowels = 0;
				this.digestionCooldown = 0;
			}
		}
		return poopin;
	}

	put(x, y) {
		this.pos.set({ x, y });
	}

	move(t) {
		if (!this.targetPos) { return false; }
		const distance = this.pos.getDistance(this.targetPos);
		if (distance === 0) {
			this.straighten(t);
			this.clearTarget();
			return false;
		}
		const moveAmount = Math.min(this.speed * t, distance);
		const unitVector = this.pos.getUnitVector(this.targetPos);
		// console.log('move from', this.pos.x, ',', this.pos.y, '+', moveAmount, 'along', unitVector, 'to', this.targetPos);
		this.pos.add(unitVector.multiply(moveAmount));
		// console.log('    new pos', this.pos);
		this.bop(t);
		return true;
	}

	straighten(t) {
		this.bopT = 0;
		this.squish = 0;
		const amount = Math.abs(this.rotation) * (t / 100); // TODO: fix this to be less jarring
		if (amount < 0.1) {
			this.rotation = 0;
			return;
		}
		const direction = (this.rotation > 0) ? -1 : 1;
		console.log(this.rotation, amount, direction);
		this.rotation += (amount * direction);
		this.leftWalkOffset = 0;
		this.rightWalkOffset = 0;
		this.turn = 0;
	}

	bop(t) {
		this.bopT += t;
		this.rotation = Math.sin(this.bopT) * 12;
		this.squish = Math.sin(this.bopT + 1) / 10;
		const walk = this.bopT * 10;
		this.leftWalkOffset = Math.sin(walk) * 30;
		this.rightWalkOffset = Math.sin(walk + HALF_PI) * 30;
		// console.log(this.bopT, this.rotation);
	}

	rotate(theta) {
		this.rotation += theta;
	}

	getRgbColor(color) {
		return `rgb(${color.r}, ${color.g}, ${color.b})`;
	}

	getHeadSvg() {
		const headColorRgb = this.getRgbColor(this.headColor);
		const headX = this.halfSize.x + (this.turn * 30);
		const headY = 0 + this.breathOffset;
		return `
			<g class="monster-head" transform="translate(${headX}, ${headY})">
				<ellipse cx="0" cy="0" rx="170" ry="150" fill="${headColorRgb}" />
				${this.getMouthSvg()}
				${this.getEyesSvg()}
			</g>
		`;
	}

	getMouthSvg() {
		const headColorRgb = this.getRgbColor(this.headColor);
		const mouthHalfWidth = this.mouthWidth / 2;
		const mouthPosition = 80;
		const chinY = mouthPosition + this.mouthHeight + 10;
		return `
			<g class="monster-mouth" transform="translate(${this.turn * 20}, 0)">
				<path d="m -${mouthHalfWidth} ${mouthPosition}
					l ${this.mouthWidth} 0
					l -${mouthHalfWidth} ${this.mouthHeight}
					l -${mouthHalfWidth} -${this.mouthHeight}"
					fill="black"
					stroke="${headColorRgb}" stroke-width="5" />
				<ellipse cx="0" cy="${chinY}" rx="30" ry="22" fill="${headColorRgb}" />
			</g>
		`;
		// <ellipse cx="0" cy="100" rx="60" ry="10" fill="black" />
	}

	getEyeHeight(minEyeHeight) {
		let eyeHeightPercent = 100;
		if (this.sick()) { eyeHeightPercent -= 20; }
		if (this.hungry()) { eyeHeightPercent -= 20; }
		if (this.unhealthy()) { eyeHeightPercent -= 20; }
		if (this.unhappy()) { eyeHeightPercent -= 20; }
		if (this.tired()) { eyeHeightPercent -= 20; }
		const h = minEyeHeight + ((eyeHeightPercent/100) * (this.maxEyeHeight - minEyeHeight));
		return this.eyeOpenAmount * h;
	}

	getEyesSvg() {
		if (this.dead()) { return this.getDeadEyesSvg(); }
		const headColorRgb = this.getRgbColor(this.headColor);
		const bodyColorRgb = this.getRgbColor(this.color);
		const minEyeHeight = 20;
		const eyeHeight = this.getEyeHeight(20);
		const eyeballsSvg = (eyeHeight < minEyeHeight) ? '' : this.getEyeballsSvg();
		return `
			<g class="monster-eyes" transform="translate(${this.turn * 20}, 0)">
				<ellipse cx="100" cy="0" rx="60" ry="${eyeHeight}" fill="white" />
				<ellipse cx="-100" cy="0" rx="60" ry="${eyeHeight}" fill="white"" />
				${eyeballsSvg}
				<ellipse cx="100" cy="0" rx="60" ry="${eyeHeight}" fill="transparent" stroke="${bodyColorRgb}" stroke-width="20" />
				<ellipse cx="-100" cy="0" rx="60" ry="${eyeHeight}" fill="transparent" stroke="${bodyColorRgb}" stroke-width="20" />
			</g>
		`;
	}

	getEyeballsSvg() {
		const irisColorRgb = this.getRgbColor(this.irisColor);
		return `
			<ellipse cx="120" cy="0" rx="12" ry="12" fill="black" stroke="${irisColorRgb}" stroke-width="10" />
			<ellipse cx="115" cy="-5" rx="4" ry="4" fill="rgba(255,255,255,0.5)" />

			<ellipse cx="-120" cy="0" rx="12" ry="12" fill="black" stroke="${irisColorRgb}" stroke-width="10" />
			<ellipse cx="-125" cy="-5" rx="4" ry="4" fill="rgba(255,255,255,0.5)" />
		`;
	}

	getDeadEyesSvg() {
		return `
			<g class="monster-eyes">
				<ellipse cx="100" cy="0" rx="60" ry="${this.maxEyeHeight}" fill="rgba(0,0,0,0.2)" />
				<ellipse cx="-100" cy="0" rx="60" ry="${this.maxEyeHeight}" fill="rgba(0,0,0,0.2)" />
				<g class="monster-dead-eye" transform="translate(0, 40) rotate(45 100 100)">
					<rect x="0" y="-50" rx="10" ry="10" width="10" height="100" fill="#000" />
					<rect x="-50" y="0" rx="10" ry="10" width="100" height="10" fill="#000" />
				</g>
				<g class="monster-dead-eye" transform="translate(-200, 40) rotate(45 100 100)">
					<rect x="0" y="-50" rx="10" ry="10" width="10" height="100" fill="#000" />
					<rect x="-50" y="0" rx="10" ry="10" width="100" height="10" fill="#000" />
				</g>
			</g>
		`;
	}

	getBodySvg() {
		const bodyColorRgb = this.getRgbColor(this.color);
		const shellColorRgb = this.getRgbColor(this.shellColor);
		const armsY = 40 + this.breathOffset;
		const bodyX = 0 - this.breathOffset;
		const bodyWidth = 200 + (this.breathOffset * 2);
		const leftArmY = 30 + (this.rightWalkOffset / 2);
		const rightArmY = 30 + (this.leftWalkOffset / 2);
		const leftKneeY = 30 + this.leftWalkOffset;
		const rightKneeY = 30 + this.rightWalkOffset;
		return `
			<g class="monster-body" transform="translate(50 50)">
				<ellipse cx="100" cy="100" rx="130" ry="150" fill="${shellColorRgb}" />
				<rect x="${bodyX}" y="0" rx="50" ry="50" width="${bodyWidth}" height="200" fill="${bodyColorRgb}" /> 
				<path d="M 0 ${armsY} l -70 ${leftArmY} l -10 30" fill="transparent" stroke="${bodyColorRgb}" stroke-width="60" stroke-linecap="round" />

				<path d="M 200 ${armsY} l 70 ${rightArmY} l 10 30" fill="transparent" stroke="${bodyColorRgb}" stroke-width="60" stroke-linecap="round" />

				<path d="M 20 200 l -40 ${leftKneeY} l -10 30" fill="transparent" stroke="${bodyColorRgb}" stroke-width="60" stroke-linecap="round" />

				<path d="M 180 200 l 40 ${rightKneeY} l 10 30" fill="transparent" stroke="${bodyColorRgb}" stroke-width="60" stroke-linecap="round" />
				
			</g>
		`;
		// compPoly.parts.forEach((part) => {
		// 	svg += getPolygonSvg(`${part.name} ${innerClass}`, bodyColorRgb, part); // `<polygon class="${part.name} part" points="${part.polygon.getPointsString()}" />`;
		// });
	}

	getEggSvg() {
		const bodyColorRgb = this.getRgbColor(this.color);
		return `
			<g class="monster-egg">
				<ellipse cx="0" cy="0" rx="200" ry="260" fill="${bodyColorRgb}" />
				<ellipse cx="-70" cy="-80" rx="100" ry="140" fill="rgba(255,255,255,0.2)" />
				<ellipse cx="-30" cy="-40" rx="140" ry="180" fill="rgba(255,255,255,0.2)" />
			</g>
		`;		
	}

	getSvg(offset, outerClass = '', innerClass = '') {
		// const compPoly = this.compPoly;
		const transform = getTransformStyle(offset, this.pos, this.halfSize, this.scale, this.rotation);
		const scaleX = this.scale;
		const scaleY = (1 - this.squish) * this.scale;

		// console.log(offset, this.pos, transform);
		//  x="${compPoly.pos.x}" y="${compPoly.pos.y}">
		const bodySvg = (this.age.isEgg()) ? this.getEggSvg() : this.getBodySvg() + this.getHeadSvg();
		return `
			<g class="${outerClass} monster" transform="${transform} scale(${scaleX} ${scaleY})"
				style="filter:url(#shadow);">
				${bodySvg}
			</g>
		`;
	}
}

export default Monster;
