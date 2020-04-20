import Loop from './Loop.js';
import Monster from './Monster.js';
import Item from './Item.js';
import XY from './XY.js';
import physics from './physics.js';
import Particle from './Particle.js';

const MAX_ITEMS = 50;
const ZOOM_SCALE = 1.05;
const options = {
	showGutter: true,
	showStats: true
};
const world = {
	size: new XY(1000, 1000),
	halfSize: new XY(500, 500),
	gutterRadius: 1000,
	isLightsOn: true
};
const offset = new XY();
const monster = new Monster();
const loop = new Loop(gameLoop);
let disp;
let particles = [];
const items = [];
const elts = {};

const POOP_TYPE = 'poop';

const FOOD_ACTION = 0;
const COMMAND_ACTION = 1;
const TOOL_ACTION = 2;
let activeAction = FOOD_ACTION;

const COMMAND_PET = 'pet';
const COMMAND_COME = 'come';
const COMMAND_SIT = 'sit';
let command = COMMAND_COME;

const FOOD_SNACK = 'snack';
const FOOD_MEAL = 'meal';
const FOOD_TREAT = 'treat';
const FOOD_MEDICINE = 'meds';

const TOOL_NEEDLE = 'needle';
const TOOL_FREEZE = 'freeze';
const TOOL_DEATH = 'deathray';

let activeCommand = COMMAND_PET;
// let activeCommandName = activeCommand;
let activeFood = FOOD_SNACK;
// let activeFoodName = activeFood;
let activeTool = TOOL_NEEDLE;
// let activeToolName = activeTool;

const unlockedGame = []
const unlockedCommands = [COMMAND_PET, COMMAND_COME, COMMAND_SIT];
const unlockedFood = ['snack', 'meal', 'treat', 'meds'];
const unlockedTools = ['needle', 'freeze', 'death'];


function $(q) { return document.querySelectorAll(q); }

function init() {
	document.addEventListener('DOMContentLoaded', setupDOMAndInput);
}

function putMonsterInCenter() {
	monster.put(world.halfSize.x, world.halfSize.y);
	// Also make monster start walking
	monster.assignRandomTarget(world.size);
}

function setupWorld() {
	world.size.set({
		x: window.innerWidth,
		y: window.innerHeight
	});
	world.halfSize = world.size.getMultiply(0.5);
	world.gutterRadius = Math.min(world.size.x, world.size.y) / 2.4;
}


function setupDOMAndInput() {
	disp = $('#display-content')[0];
	const setElt = (className) => {
		elts[className] = $(`.${className}`)[0];
	};
	['activate-food', 'activate-command', 'activate-tool', 'info-left', 'info-right', 'splash'].forEach(setElt);

	elts['splash'].addEventListener('click', (event) => {
		event.preventDefault();
		event.stopPropagation();
		const display = $('#display')[0];
		setupDomInteractions(display);
		begin();
	});

	// begin(); // TODO: add splash screen and a click to start
}

function setupDomInteractions(display) {
	// https://www.html5rocks.com/en/mobile/touchandmouse/
	let pickedUp = { item: null, pos: null, initialPos: null };

	function onClick(event) {
		console.log('click');
		const { target } = event;
		if (target.matches('.activate-food')) {
			setActiveAction(FOOD_ACTION);
		} else if (target.matches('.activate-command')) {
			setActiveAction(COMMAND_ACTION);
		} else if (target.matches('.activate-tool')) {
			setActiveAction(TOOL_ACTION);
		} else if (target.matches('.open-sub')) {
			toggleSubMenu(target);
		} else if (target.matches('.select-command')) {
			activeCommand = target.dataset.type;
			setActiveAction(COMMAND_ACTION);
			toggleSubMenu(target);
		} else if (target.matches('.select-food')) {
			activeFood = target.dataset.type;
			setActiveAction(FOOD_ACTION);
			toggleSubMenu(target);
		} else if (target.matches('.select-tool')) {
			activeTool = target.dataset.type;
			setActiveAction(TOOL_ACTION);
			toggleSubMenu(target);
		} else if (target.matches('.toggle-lights')) {
			world.isLightsOn = document.body.classList.toggle('lights-on');
		} else if (target.matches('.toggle-stats')) {
			options.showStats = !options.showStats;
			drawUi();
		} else if (target.matches('.toggle-gutter')) {
			options.showGutter = !options.showGutter;
		} else if (target.matches('.toggle-pause')) {
			loop.toggle();
		} else if (target.matches('.reset-game')) {
			window.location.reload();
		}
		if (target.matches('button')) {
			return;
		}
		if (target.closest('.item')) {
			console.log('item click');
			return;
		}
		const clickedMonster = (target.closest('.monster')) ? true : false;
		const xy = getEventXY(event);
		doAction(activeAction, xy, clickedMonster);
	}

	function onTapStart(event) {
		// console.log('touch start', event.type);
		event.preventDefault();
		const { target } = event;
		dropPickedUp(pickedUp, onTouchMove, onTouchEnd);
		const itemElt = target.closest('.item');
		
		if (!itemElt) {
			return onClick(event);
		}
		const xy = getEventXY(event);
		pickup(pickedUp, target, itemElt, xy, onTouchMove, onTouchEnd);
		console.log('item picked up', pickedUp);
		
	}

	function onTouchMove(event) {
		// console.log('touch move', event.type);
		event.preventDefault();
		if (!pickedUp.item) { return; }
		const xy = getEventXY(event);
		const diffXY = xy.clone().subtract(pickedUp.pos);
		pickedUp.item.pos.add(diffXY);
		pickedUp.pos.set(xy);
		if (activeAction === TOOL_ACTION) {
			doActionOnItem(activeAction, activeTool, pickedUp.item);
		}
	}

	function onTouchEnd(event) {
		// console.log('touch end', event.type);
		event.preventDefault();
		dropPickedUp(pickedUp, onTouchMove, onTouchEnd);
	}

	display.addEventListener('touchstart', onTapStart);
	display.addEventListener('touchend', onTouchEnd);
	display.addEventListener('touchmove', onTouchMove);

	display.addEventListener('mousedown', onTapStart);
	display.addEventListener('mouseup', onTouchEnd);
	display.addEventListener('mousemove', onTouchMove);

	document.addEventListener('click', onClick);
}

function getEventXY(e) {
	let x, y;
	if (e.type === 'touchstart' || e.type === 'touchmove') {
		x = e.touches[0].clientX; // - xOffset;
		y = e.touches[0].clientY; // - yOffset;
	} else {
		x = e.clientX; // - xOffset;
		y = e.clientY; // - yOffset;
	}
	return new XY(x, y);
}

function pickup(pickedUp, target, itemElt, xy, onTouchMove, onTouchEnd) {
	const id = Number(itemElt.dataset.itemid);
	pickedUp.target = target;
	pickedUp.itemElt = itemElt;
	pickedUp.item = items.find((thisItem) => { return thisItem.id === id; });
	pickedUp.pos = xy.clone();
	pickedUp.initialPos = xy.clone();
	console.log(id, pickedUp.item);
	target.addEventListener('touchmove', onTouchMove);
	target.addEventListener('touchend', onTouchEnd);	
}

function dropPickedUp(pickedUp, onTouchMove, onTouchEnd) {
	if (!pickedUp.item) { return; }
	console.log('drop');
	pickedUp.target.removeEventListener('touchmove', onTouchMove);
	pickedUp.target.removeEventListener('touchend', onTouchEnd);
	pickedUp.item = null;
	pickedUp.pos = null;
}

function toggleSubMenu(elt) {
	const li = elt.closest('.main-list > li');
	const subList = li.querySelector('.sub-list');
	subList.classList.toggle('open');
	drawUi();
}

function setActiveAction(action) {
	activeAction = action;
	drawUi();
}

function doAction(action, pos, onMonster) {
	console.log('doAction', action, activeFood, activeCommand);
	switch(action) {
		case FOOD_ACTION: {
			dropFood(pos, activeFood);
			break;
		}
		case COMMAND_ACTION: {
			switch(activeCommand) {
				case COMMAND_PET: {
					if (onMonster) {
						monster.pet();
					}
					break;
				}
				case COMMAND_COME: {
					monster.come(pos);
					break;
				}
				case COMMAND_SIT: {
					monster.sit();
					break;
				}
			}
			break;
		}
		case TOOL_ACTION: {
			switch(activeTool) {
				case TOOL_NEEDLE: {
					if (onMonster) {
						monster.vaccinate();
					}
					break;
				}
				case TOOL_DEATH: {
					if (onMonster) {
						monster.damage(255);
					}
					break;
				}
			}
			break;
		}
	}
}

function doActionOnItem(action, tool, item) {
	if (action === TOOL_ACTION) {
		if (tool === TOOL_DEATH) {
			item.zap(1);
		}
	}
}

function restart() {
	elts.failure.classList.remove('on');
	elts.win.classList.remove('on');
	setupWorld();
	begin();
}

function begin() {
	document.body.classList.add('begin');
	setupWorld();
	putMonsterInCenter();
	drawSvgDisplay();
	drawUi();
	loop.start();
}

function getCompositePolygonSvg(compPoly, outerClass = '', innerClass = '') {
	let svg = `<g class="${outerClass}" transform="${compPoly.getTransformStyle(offset)}" x="${compPoly.pos.x}" y="${compPoly.pos.y}">`;
	compPoly.parts.forEach((part) => {
		svg += getPolygonSvg(`${part.name} ${innerClass}`, part); // `<polygon class="${part.name} part" points="${part.polygon.getPointsString()}" />`;
	});
	svg += '</g>';
	return svg;
}

function getPolygonSvg(classNames, polygon) {
	return `<polygon class="${classNames}" points="${polygon.getPointsString()}" />`;
}

function getPolyLineSvg(arr, classNames) {
	return `<polyline class="${classNames}" points="${getPointsString(arr)}" />`;
}

function getPointsString(arr) {
	return arr.map((point) => { return `${point.x + offset.x} ${point.y + offset.y}`; }).join(', ');
}

function getParticlesSvg() {
	let svg = '';
	particles.forEach((p) => {
		svg += getCompositePolygonSvg(p, 'particle');
	});
	// if (particles.length) { console.log(svg); }
	return svg;
}

function dropPoop(pos) {
	items.push(new Item(pos, POOP_TYPE));
}

function dropFood(pos, activeFood) {
	if (items.length >= MAX_ITEMS) { return false; }
	const food = new Item(pos, activeFood);
	items.push(food);
}

function getItemsSvg(items = []) {
	return items.reduce((svg, item) => { return svg + item.getSvg(); }, '');
}

function decayItems(items = [], t, tick) {
	items.forEach((item) => {
		if (isItemInGutter(item)) {
			item.decay(t);
		}
	});
	removeDecayedItem(items);
}

function isItemInGutter(item) {
	if (item.pos.x < (world.halfSize.x - world.gutterRadius)) { return true; }
	if (item.pos.x > (world.halfSize.x + world.gutterRadius)) { return true; }
	if (item.pos.y < (world.halfSize.y - world.gutterRadius)) { return true; }
	if (item.pos.y > (world.halfSize.y + world.gutterRadius)) { return true; }
	// if (item.pos.getDistance(world.halfSize) > world.gutterRadius) { return true; }
	return false;
}

function removeDecayedItem(items = []) {
	// Removes one at a time
	const i = items.findIndex((item) => {
		return item.isDecayed();
	});
	if (i > -1) {
		items.splice(i, 1);
	}
}

function getGutterSvg() {
	if (!options.showGutter) { return ''; }
	// return `<ellipse cx="${world.halfSize.x}" cy="${world.halfSize.y}" rx="${world.gutterRadius}" ry="${world.gutterRadius}" fill="transparent" stroke="rgba(0,0,0,0.1)" stroke-width="5" />`;
	return `
		<rect x="${world.halfSize.x - world.gutterRadius}" y="${world.halfSize.y - world.gutterRadius}"
			rx="10" ry="10"
			width="${world.gutterRadius * 2}" height="${world.gutterRadius * 2}"
			fill="transparent" stroke="rgba(0,0,0,0.1)" stroke-width="5" />
	`;
}

function drawSvgDisplay() {
	disp.innerHTML = (
		getGutterSvg()
		+ monster.getSvg(offset)
		+ getItemsSvg(items)
		// getPolyLineSvg(ship.trail, 'trail')
		// + getCompositePolygonSvg(moon, 'moon')
		// + getCompositePolygonSvg(ship, 'ship', partClass)
		+ getParticlesSvg()
	);
	disp.setAttribute('viewBox', `0 0 ${world.size.x} ${world.size.y}`);
	writeValues();
}

function getStatsHtml() {
	if (!options.showStats) { return `<ul><li>${monster.getLifecycleName()}</li></ul>`; }
	return `<ul>
		<li>${monster.getLifecycleName()}</li>
		<li>Age: ${monster.getAge()}</li>
		<li>Happiness: ${Math.round(monster.happiness)}</li>
		<li>Hunger: ${Math.round(monster.hunger)}</li>
		<li>Energy: ${Math.round(monster.energy)}</li>
		<li>Health: ${Math.round(monster.health)}</li>
		<li>Vaccination: ${Math.round(monster.vaccination)}</li>
		<li>Sickness: ${Math.round(monster.sickness)}</li>
		<li>Sick Chance: ${Math.round(monster.lastChanceOfSickness)}%</li>
		<li>Bowels: ${Math.round(monster.bowels)}</li>
		<li>Digestion: ${Math.round(monster.digestionCooldown)}</li>
		<li>Cooldown: ${Math.round(monster.actionCooldown)}</li>
	</ul>`;
}

function drawUi() {
	elts['activate-food'].classList.toggle('active', (activeAction === FOOD_ACTION));
	elts['activate-command'].classList.toggle('active', (activeAction === COMMAND_ACTION));
	elts['activate-tool'].classList.toggle('active', (activeAction === TOOL_ACTION));
	elts['info-left'].innerHTML = getStatusesHtml(monster.getStatuses());
	elts['info-right'].innerHTML = getStatsHtml();
	elts['activate-command'].innerHTML = activeCommand;
	elts['activate-food'].innerHTML = activeFood;
	elts['activate-tool'].innerHTML = activeTool;
}

function getStatusesHtml(statuses) {
	const listItems = statuses.reduce((html, status) => {
		return html + status.getHtml('li');
	}, '');
	// console.log(statuses, listItems);
	return `<ul>${listItems}</ul>`;
}

function writeValues() {
	// writeNum(Math.ceil(ship.health), 'health');
	// writeRoundNum(ship.vel.x, 'speedX');
	// writeRoundNum(ship.vel.y, 'speedY');
	// writeRoundNum(ship.fuel, 'fuel');
	// writeRoundNum(ship.mass, 'mass');
	// writeRoundNum(getAltitude(), 'altitude');
}

function writeNum(n, eltName) {
	elts[eltName].innerHTML = n;
}

function writeRoundNum(n, eltName) {
	writeNum(Math.round(n), eltName);
}

function getAltitude() {
	const r = moon.pos.getDistance(ship.pos);
	return r - moon.innerRadius - ship.innerRadius;
}

function gameLoop(t, tick) { // t is the delta time
	const restarting = false; // ??
	let stopping = false; // ??
	// physics(particles, t);
	// decayParticles(particles, t);

	// focusOffset(monster);
	monster.advance(t, tick, world.size, items, command, world);
	if (monster.poop(t)) {
		dropPoop(monster.pos.clone().add({ x: 0, y: 120 }));
	}
	decayItems(items, t, tick);
	drawSvgDisplay();
	if (tick % 50 === 0) {
		drawUi();
	}
	if (restarting) {
		restart();
		return;
	}
	return stopping;
}

function makeParticle(pos) {
	const p = new Particle(currentExhaustPoint, [0,0, 2,2, 1,1]);
	// p.vel.set();
	p.mass = 1;
	p.decayLife = 2;
	particles.push(p);
}

function decayParticles(objs = [], t) {
	for(let i = objs.length - 1; i >= 0; i--) {
		decayParticle(i, objs, t);
	}
}

function decayParticle(i, objs, t) {
	const p = objs[i];
	if (!(p instanceof Particle)) { return; }
	const isDecayed = p.decay(t);
	if (isDecayed) {
		objs.splice(i, 1);
	}
}

function focusOffset(target) {
	const desiredOffset = new XY(
		(world.size.x / 2) - target.pos.x,
		(world.size.y / 2.5) - target.pos.y
	);
	offset.add(desiredOffset);
	offset.multiply(1 / 2);
}

function zoom(z) {
	if (z == 0) { return; }
	world.size.multiply( (z > 0) ? 1/ZOOM_SCALE : ZOOM_SCALE );
}

const game = (function(){
	init();
	return { monster, items, world, particles, loop };
})();

console.log(game);
if (window) { window.g = game; }
export default game;
