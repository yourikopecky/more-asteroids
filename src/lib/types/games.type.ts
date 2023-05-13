export type Alert = {
	display: boolean;
	message: string;
	color: 'red' | 'green' | 'blue';
	duration: number;
};

export type Coordinates = {
	x: number;
	y: number;
};

export type Hitbox = {
	height: number;
	width: number;
};

export type Bullet = {
	id: number;
	position: Coordinates;
	initialSpaceShipState: {
		position: {
			x: number;
			y: number;
		};
		rotation: number;
	};
};

export type Asteroid = {
	id: number;
	position: Coordinates;
	rotation: number;
	type: 1 | 2;
};

export type Bonus = {
	id: number;
	position: Coordinates;
};
