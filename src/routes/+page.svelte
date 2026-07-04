<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { enhance } from '$app/forms';
	import { LayoutGrid, List, Plus, Star, Trash2 } from '@lucide/svelte';
	import { formatMovieCardMeta, formatMovieMeta } from '$lib/movie';
	import { posterUrl } from '$lib/tmdb';
	import type { ActionData } from './$types';
	import type { PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	interface SearchResult {
		id: number;
		title: string;
		poster_path: string;
		release_date?: string;
	}

	function searchResultYear(releaseDate: string | undefined): string | null {
		if (!releaseDate) return null;
		const year = releaseDate.slice(0, 4);
		return /^\d{4}$/.test(year) ? year : null;
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

	type ViewMode = 'list' | 'cards';

	let viewMode = $state<ViewMode>('list');
	let persistViewMode = $state(false);

	onMount(() => {
		const saved = localStorage.getItem('watchlist-view');
		if (saved === 'list' || saved === 'cards') {
			viewMode = saved;
		}
		persistViewMode = true;
	});

	$effect(() => {
		if (!persistViewMode || typeof localStorage === 'undefined') return;
		localStorage.setItem('watchlist-view', viewMode);
	});
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
							<input type="hidden" name="tmdbId" value={result.id} />
							<input type="hidden" name="posterPath" value={result.poster_path} />
							<img
								src={posterUrl(result.poster_path)}
								alt=""
								width="46"
								height="69"
								loading="lazy"
							/>
							<span class="search-result-title">
								{result.title}
								{#if searchResultYear(result.release_date)}
									<span class="search-result-year">({searchResultYear(result.release_date)})</span>
								{/if}
							</span>
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

{#if data.hasMovies || data.selectedGenre || data.movies.length > 0}
	<div class="watchlist-toolbar">
		<form method="get" class="genre-filter">
			<label for="genre">Genre</label>
			<select
				id="genre"
				name="genre"
				value={data.selectedGenre}
				onchange={(e) => e.currentTarget.form?.requestSubmit()}
			>
				<option value="">All genres</option>
				{#each data.genres as genreName (genreName)}
					<option value={genreName}>{genreName}</option>
				{/each}
			</select>
		</form>
		{#if data.movies.length > 0}
			<div class="view-toggle" role="group" aria-label="View mode">
				<button
					type="button"
					class="view-toggle-btn"
					class:view-toggle-btn-active={viewMode === 'list'}
					aria-pressed={viewMode === 'list'}
					aria-label="List view"
					onclick={() => (viewMode = 'list')}
				>
					<List size={18} />
				</button>
				<button
					type="button"
					class="view-toggle-btn"
					class:view-toggle-btn-active={viewMode === 'cards'}
					aria-pressed={viewMode === 'cards'}
					aria-label="Card view"
					onclick={() => (viewMode = 'cards')}
				>
					<LayoutGrid size={18} />
				</button>
			</div>
		{/if}
	</div>
{/if}

{#if data.movies.length === 0 && !data.selectedGenre}
	<p class="empty-state">Let's get started! Try adding your first movie.</p>
{:else if data.movies.length === 0 && data.selectedGenre}
	<p class="filter-status">No movies in your watchlist match this genre.</p>
{:else}
	<ul class="movie-list" class:movie-list--cards={viewMode === 'cards'}>
		{#each data.movies as movie (movie.id)}
			{@const meta =
				viewMode === 'cards' ? formatMovieCardMeta(movie) : formatMovieMeta(movie)}
			<li class="movie-item" class:movie-item--card={viewMode === 'cards'}>
				{#if movie.posterUrl}
					<img
						src={movie.posterUrl}
						alt=""
						width="42"
						height="63"
						loading="lazy"
						class="movie-poster"
					/>
				{/if}
				<form method="post" use:enhance>
					<input type="hidden" name="id" value={movie.id} />
					<div class="movie-info">
						<span class="movie-title">{movie.title}</span>
						{#if meta}
							<span class="movie-meta">{meta}</span>
						{/if}
					</div>
					<div class="movie-actions">
						<button
							type="submit"
							formaction="?/toggleFavourite"
							class="btn-icon star-btn"
							class:star-active={movie.isFavourite}
							aria-label={movie.isFavourite
								? `Remove favourite from ${movie.title}`
								: `Favourite ${movie.title}`}
						>
							<Star size={18} fill={movie.isFavourite ? 'currentColor' : 'none'} />
						</button>
						<button
							type="submit"
							formaction="?/removeMovie"
							class="btn-icon"
							aria-label="Remove {movie.title}"
						>
							<Trash2 size={18} />
						</button>
					</div>
				</form>
			</li>
		{/each}
	</ul>
{/if}
