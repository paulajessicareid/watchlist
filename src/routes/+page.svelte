<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';
	import type { PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<h1>Watchlist</h1>
<form method="post" action="?/addMovie" use:enhance>
	<label>
		Title
		<input type="text" name="title" />
	</label>
	<button>Add</button>
</form>
{#if form?.success === false}
	<p class="error">{form?.message ?? ''}</p>
{/if}
<ul>
	{#each data.movies as movie (movie.id)}
		<li>{movie.title}</li>
	{/each}
</ul>
<form method="post" action="?/signOut" use:enhance>
	<button>Sign out</button>
</form>
