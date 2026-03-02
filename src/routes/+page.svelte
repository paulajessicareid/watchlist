<script lang="ts">
	import { tick } from 'svelte';
	import { enhance } from '$app/forms';
	import { Plus, Trash2 } from '@lucide/svelte';
	import { posterUrl } from '$lib/tmdb';
	import type { ActionData } from './$types';
	import type { PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	interface SearchResult {
		id: number;
		title: string;
		poster_path: string;
	}

	let searchQuery = $state('');
	let searchResults = $state<SearchResult[]>([]);
	let searchLoading = $state(false);
	$effect(() => {
		const q = searchQuery.trim();
		if (!q) {
			searchResults = [];
			searchLoading = false;
			return () => {};
		}

		const id = setTimeout(async () => {
			searchLoading = true;
			try {
				const res = await fetch(`/api/search-movies?q=${encodeURIComponent(q)}`);
				if (res.ok) {
					const { results } = await res.json();
					searchResults = results ?? [];
				} else {
					searchResults = [];
				}
			} catch {
				searchResults = [];
			} finally {
				searchLoading = false;
			}
		}, 300);

		return () => clearTimeout(id);
	});

	function clearSearch() {
		searchQuery = '';
		searchResults = [];
	}
</script>

<div class="add-movie-form">
	<div class="form-group">
		<label for="search">Add a movie</label>
		<input
			id="search"
			type="text"
			placeholder="Search for a movie to add…"
			bind:value={searchQuery}
		/>
	</div>
</div>

{#if searchQuery.trim()}
	<div class="search-results">
		{#if searchLoading}
			<p class="search-status">Searching…</p>
		{:else if searchResults.length === 0}
			<p class="search-status">No movies found</p>
		{:else}
			<ul class="search-results-list">
				{#each searchResults as result (result.id)}
					<li class="search-result">
						<form
							method="post"
							action="?/addMovie"
							use:enhance={() => {
								return async ({ result, update }) => {
									await update();
									if (result.type === 'success') {
										clearSearch();
										await tick();
										document.getElementById('search')?.focus();
									}
								};
							}}
						>
							<input type="hidden" name="title" value={result.title} />
							<input type="hidden" name="posterPath" value={result.poster_path} />
							<img
								src={posterUrl(result.poster_path)}
								alt=""
								width="46"
								height="69"
								loading="lazy"
							/>
							<span class="search-result-title">{result.title}</span>
							<button type="submit" class="btn-primary">
								<Plus size={18} />
								Add
							</button>
						</form>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
{/if}

{#if form?.success === false}
	<p class="error">{form?.message ?? ''}</p>
{/if}

<ul class="movie-list">
	{#each data.movies as movie (movie.id)}
		<li class="movie-item">
			{#if movie.posterUrl}
				<img
					src={movie.posterUrl}
					alt=""
					width="46"
					height="69"
					loading="lazy"
					class="movie-poster"
				/>
			{/if}
			<form method="post" action="?/removeMovie" use:enhance>
				<input type="hidden" name="id" value={movie.id} />
				<span class="movie-title">{movie.title}</span>
				<button type="submit" class="btn-icon" aria-label="Remove {movie.title}">
					<Trash2 size={18} />
				</button>
			</form>
		</li>
	{/each}
</ul>
