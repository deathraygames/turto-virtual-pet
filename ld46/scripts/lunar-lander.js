import physics from './physics.js';
import Input from './Input.js';
import XY from './XY.js';
import Loop from './Loop.js';
// Things
import Ship from './Ship.js';
import CompositePolygon from './CompositePolygon.js';
import Particle from './Particle.js';

const game = (function(){

const ZOOM_SCALE = 1.05;
const ORBITAL_MULTIPLIER = 1.35;
const WORLD_X = 2000, WORLD_Y = 1500;
const input = new Input();
const worldSize = new XY(WORLD_X, WORLD_Y);
const offset = new XY();
const loop = new Loop(gameLoop);
let disp;
let ship, moon, physicalObjects = [], particles = [];
const elts = {};

init();

return {
	input, ship, moon, physicalObjects, particles,
	loop,
	getPointsString,
};

function $(q) { return document.querySelectorAll(q); }

function init() {
	setupWorld();
	document.addEventListener('DOMContentLoaded', setupDOMAndInput);
}

function setupWorld() {
	ship = physics.physical(new Ship({
		top: [0, 10,  10, 0,  30, 0,  40, 10,  40, 30,  30, 40,  10, 40,  0, 30],
		core: [0,40, 40,40, 40,56, 0,56],
		engine: [15,56, 25,56, 30,70, 10,70],
		leg1: [],
		leg2: [],
	}, {x: 15, y: 70}));
	ship.name = 'ship';
	ship.mass = 500 + ship.fuel;	
	ship.rotation = Math.random() * 360;
	// ship.vel.y = -20 + Math.random() * -200;
	// ship.vel.x = 50 + Math.random() * 300;
	ship.pos.x = -600;
	ship.pos.y = 0;

	moon = physics.physical(new CompositePolygon({ 
		chunk: [
			100,100, 300,0, 500,100, 
			600,300, 
			500,500, 300,600, 100,500,
			0,300
		]
	}));
	moon.name = 'moon';
	moon.mass = 1000000;
	moon.pos.x = 0;
	moon.pos.y = 0;

	physicalObjects = [moon, ship];

	const orbitalVel = physics.getOrbitalVelocity(ship, moon).multiply(ORBITAL_MULTIPLIER);
	ship.vel.set(orbitalVel);
	console.log('ship velocity', ship.vel);

	worldSize.x = WORLD_X;
	worldSize.y = WORLD_Y;
}

function setupDOMAndInput() {
	disp = $('#display')[0];
	const setElt = (className) => {
		elts[className] = $(`.${className}`)[0];
	};
	['health', 'speedX', 'speedY', 'fuel', 'mass', 'altitude', 'intro', 'failure', 'win'].forEach(setElt);
	elts.intro.classList.add('on');
	input.init(disp, document);
	input.anyKeyDownAction = begin;
}

function restart() {
	elts.failure.classList.remove('on');
	elts.win.classList.remove('on');
	setupWorld();
	begin();
}

function begin() {
	input.clear();
	elts.intro.classList.remove('on');
	const dl = $('dl');
	dl.forEach((elt) => { elt.classList.add('on'); });
	loop.begin();
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

function draw() {
	const partClass = 'part ' + ship.getAlertLevel();
	disp.innerHTML = (
		getPolyLineSvg(ship.trail, 'trail')
		+ getCompositePolygonSvg(moon, 'moon')
		+ getCompositePolygonSvg(ship, 'ship', partClass)
		+ getParticlesSvg()
	);
	disp.setAttribute('viewBox', `0 0 ${worldSize.x} ${worldSize.y}`);
	writeValues();
}

function writeValues() {
	writeNum(Math.ceil(ship.health), 'health');
	writeRoundNum(ship.vel.x, 'speedX');
	writeRoundNum(ship.vel.y, 'speedY');
	writeRoundNum(ship.fuel, 'fuel');
	writeRoundNum(ship.mass, 'mass');
	writeRoundNum(getAltitude(), 'altitude');
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

function gameLoop(deltaT) {
	const restarting = handleInput();
	let stopping = restarting;
	physics(physicalObjects.concat(particles), deltaT);
	decayParticles(particles, deltaT);
	ship.appendTrail();
	focusOffset(ship);
	draw();
	if (ship.dead()) {
		elts.failure.classList.add('on');
	} else if (getAltitude() < 0.5 && ship.vel.getMagnitude() < 0.5) {
		elts.win.classList.add('on');
	}
	if (restarting) {
		restart();
		return;
	}
	return stopping;
}

function decayParticles(objs, deltaT) {
	for(let i = objs.length - 1; i >= 0; i--) {
		decayParticle(i, objs, deltaT);
	}
}

function decayParticle(i, objs, deltaT) {
	const p = objs[i];
	if (!(p instanceof Particle)) { return; }
	const isDecayed = p.decay(deltaT);
	if (isDecayed) {
		objs.splice(i, 1);
	}
}

function focusOffset(target) {
	const desiredOffset = new XY(
		(worldSize.x / 2) - target.pos.x,
		(worldSize.y / 2.5) - target.pos.y
	);
	offset.add(desiredOffset);
	offset.multiply(1 / 2);
}

function handleInput() {
	if (input.leftRight) {
		ship.spin(input.leftRight * -3);
	}
	if (input.forwardBackward > 0) {
		const newParticles = ship.thrust(input.forwardBackward);
		if (newParticles) {
			particles.push(...newParticles);
		}
	}
	if (input.zoom !== 0) {
		zoom(input.zoom);
	}
	return (input.currentKeyInstruction === 'enter');
}

function zoom(z) {
	if (z == 0) { return; }
	worldSize.multiply( (z > 0) ? 1/ZOOM_SCALE : ZOOM_SCALE );
}

})();

// console.log(g);
if (window) { window.g = game; }
export default game;
