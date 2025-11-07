const isProd = import.meta.env.MODE === 'production';
export const Logger = {
	log: (...message: unknown[]) => {
		if (isProd) return;
		console.log(...message);
	},
	error: (...message: unknown[]) => {
		if (isProd) return;
		console.error(...message);
	},
	warn: (...message: unknown[]) => {
		if (isProd) return;
		console.warn(...message);
	},
	info: (...message: unknown[]) => {
		if (isProd) return;
		console.info(...message);
	},
	debug: (...message: unknown[]) => {
		if (isProd) return;
		console.debug(...message);
	}
};
