<script lang="ts">
	import { tick } from 'svelte';
	import { enhance } from '$app/forms';
	import { Plus, Trash2 } from '@lucide/svelte';
	import type { ActionData } from './$types';
	import type { PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<form
	method="post"
	action="?/addMovie"
	use:enhance={() => {
		return async ({ result, update }) => {
			await update();
			if (result.type === 'success') {
				await tick();
				document.getElementById('title')?.focus();
			}
		};
	}}
	class="add-movie-form"
>
	<div class="form-group">
		<label for="title">Title</label>
		<input id="title" type="text" name="title" placeholder="Add a movie…" />
	</div>
	<button type="submit">
		<Plus size={18} />
		Add
	</button>
</form>
{#if form?.success === false}
	<p class="error">{form?.message ?? ''}</p>
{/if}
<ul class="movie-list">
	{#each data.movies as movie (movie.id)}
		<li class="movie-item">
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
