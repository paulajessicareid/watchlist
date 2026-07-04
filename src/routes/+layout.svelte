<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { LogOut, User } from '@lucide/svelte';
	import { enhance } from '$app/forms';

	let { data, children } = $props();
</script>

<svelte:head>
	<title>FILMHEADS</title>
	<meta name="description" content="Track the films you want to watch." />
	<link rel="icon" href={favicon} type="image/svg+xml" />
</svelte:head>

<header class="header container">
	<a href="/" class="header-title">
		<img src={favicon} alt="" class="header-logo" width="32" height="32" />
		<span class="header-wordmark">Filmheads</span>
	</a>
	{#if data.user}
		<div class="header-user">
			<User size={16} />
			<span class="header-user-name">{data.user.name || data.user.email}</span>
			<form method="post" action="/logout?/signOut" use:enhance>
				<button type="submit" class="btn-icon" aria-label="Sign out">
					<LogOut size={18} />
				</button>
			</form>
		</div>
	{/if}
</header>

<main class="container">
	{@render children()}
</main>
