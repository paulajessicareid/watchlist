import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Page from './+page.svelte';

describe('/+page.svelte', () => {
	it('should render add movie form', async () => {
		render(Page, {
			data: { movies: [] },
			form: undefined
		});

		const input = page.getByPlaceholder('Add a movie…');
		await expect.element(input).toBeInTheDocument();
	});
});
