<script lang="ts">
	import { enhance } from '$app/forms';
	import { LogOut } from '@lucide/svelte';
</script>

<svelte:head>
	<title>Sign out</title>
</svelte:head>

<form method="post" action="?/signOut" use:enhance>
		<button type="submit" class="btn-primary">
			<LogOut size={18} />
			Sign out
		</button>
</form>
