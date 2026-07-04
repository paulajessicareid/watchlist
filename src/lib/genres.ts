export const MOVIE_GENRES = [
	'Action',
	'Adventure',
	'Animation',
	'Comedy',
	'Crime',
	'Documentary',
	'Drama',
	'Family',
	'Fantasy',
	'History',
	'Horror',
	'Music',
	'Mystery',
	'Romance',
	'Science Fiction',
	'Thriller',
	'War',
	'Western'
] as const;

export type MovieGenreName = (typeof MOVIE_GENRES)[number];

export function isMovieGenre(value: string): value is MovieGenreName {
	return (MOVIE_GENRES as readonly string[]).includes(value);
}
