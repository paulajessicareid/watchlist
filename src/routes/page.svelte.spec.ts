import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Page from './+page.svelte';

describe('/+page.svelte', () => {
	it('should render add movie form', async () => {
		render(Page, {
			data: {
				user: { id: 'test', name: 'Test', email: 'test@example.com', image: null },
				movies: [],
				genres: [],
				selectedGenre: '',
				hasMovies: false
			},
			form: null
		});

		const input = page.getByPlaceholder('Search for a movie to add…');
		await expect.element(input).toBeInTheDocument();
	});
});
