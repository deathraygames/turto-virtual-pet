import XY from './XY.js';

let itemCounter = 0;

const types = {
	snack: { foodValue: 20, happyValue: 5, medicalValue: 0, contagion: 0, decayCooldown: 30 },
	meal: { foodValue: 40, happyValue: 1, medicalValue: 0, contagion: 0, decayCooldown: 20 },
	treat: { foodValue: 1, happyValue: 10, medicalValue: 0, contagion: 0, decayCooldown: 40 },
	meds: { foodValue: 0, happyValue: -20, medicalValue: 12, contagion: 0, decayCooldown: 120 },
	poop: { foodValue: 0, happyValue: -50, medicalValue: 0, contagion: 10, decayCooldown: 10 }
};

class Item {
	constructor(pos, type) {
		this.id = itemCounter++;
		this.pos = new XY();
		if (pos) { this.pos.set(pos); }
		this.type = type;
		this.foodValue = (types[type]) ? types[type].foodValue : 0;
		this.happyValue = (types[type]) ? types[type].happyValue : 0;
		this.medicalValue = (types[type]) ? types[type].medicalValue : 0;
		this.contagion = (types[type]) ? types[type].contagion : 0;
		this.tilt = Math.round(Math.random() * 90) - 45;
		this.decayCooldown = (types[type]) ? types[type].decayCooldown : 0;
	}

	decay(t) {
		this.decayCooldown -= t;
	}

	isDecayed() {
		return (this.decayCooldown <= 0);
	}

	isDecaying() {
		return (this.decayCooldown <= 5);
	}

	getOpacity() {
		if (this.decayCooldown > 5) { return 1; }
		return Math.max(0, this.decayCooldown / 5);
	}

	zap(amount = 1) {
		this.decayCooldown -= amount;
	}

	getTypeSvg() {
		switch(this.type) {
			case 'snack': {
				return `
					<g transform="rotate(${this.tilt}, 0, 0)">
						<ellipse cx="0" cy="-10" rx="16" ry="18" fill="rgb(200,140,100)" />
						<ellipse cx="0" cy="20" rx="16" ry="18" fill="rgb(200,140,100)" />
					</g>
				`;
			}
			case 'treat': {
				return `
					<g transform="rotate(${this.tilt}, 0, 0)">
						<path d="M 0 0 l -30 -16 l 0 32" fill="rgb(0,130,190)" />
						<path d="M 0 0 l 30 -16 l 0 32" fill="rgb(0,130,190)" />
						<ellipse cx="0" cy="0" rx="18" ry="18" fill="rgb(0,140,200)" />
					</g>
				`;
			}
			case 'meal': {
				return `
					<ellipse cx="0" cy="0" rx="30" ry="24" fill="rgb(40,210,90)" />
					<ellipse cx="0" cy="0" rx="32" ry="20" fill="rgb(50,220,100)" transform="rotate(${this.tilt}, 0, 0)" />
					<ellipse cx="0" cy="0" rx="20" ry="5" fill="rgb(230,160,90)" transform="rotate(${this.tilt}, 0, 0)" />
				`;
			}
			case 'meds': {
				return `
					<ellipse cx="0" cy="0" rx="16" ry="16" fill="rgb(200,200,200)" />
				`;
			}
			case 'poop': {
				const poopColor = 'rgb(50,30,0)';
				return `
					<ellipse cx="0" cy="-10" rx="10" ry="20" fill="${poopColor}" transform="rotate(${this.tilt}, 0, 0)" />
					<ellipse cx="0" cy="0" rx="20" ry="10" fill="${poopColor}" />
					<ellipse cx="0" cy="10" rx="40" ry="10" fill="${poopColor}" />	
				`;
			}
			default: {
				return `
					<ellipse cx="0" cy="0" rx="20" ry="20" fill="rgb(200,200,200)"
						stroke="transparent" />
					<ellipse cx="0" cy="20" rx="20" ry="20" fill="rgb(200,200,200)"
						stroke="transparent" />
				`;				
			}
		}
	}
	getSvg() {
		const opacity = this.getOpacity();
		return `<g class="item item-${this.type}"
					transform="translate(${this.pos.x},${this.pos.y})"
					style="filter:url(#shadow);"
					opacity="${opacity}"
					data-itemid="${this.id}">
					${this.getTypeSvg()}
				</g>`;
	}
}

export default Item;
