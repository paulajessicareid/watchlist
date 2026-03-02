const IMAGE_BASE = 'https://image.tmdb.org/t/p';

export function posterUrl(path: string, size = 'w92'): string {
	return `${IMAGE_BASE}/${size}${path}`;
}
