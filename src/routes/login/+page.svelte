<script lang="ts">
	import { enhance } from '$app/forms';
	import { Mail, Lock, User } from '@lucide/svelte';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<h1>Login</h1>
<form method="post" action="?/signInEmail" use:enhance class="login-form">
	<div class="form-group">
		<label for="email">
			<Mail size={16} />
			Email
		</label>
		<input id="email" type="email" name="email" placeholder="you@example.com" />
	</div>
	<div class="form-group">
		<label for="password">
			<Lock size={16} />
			Password
		</label>
		<input id="password" type="password" name="password" placeholder="••••••••" />
	</div>
	<div class="form-group">
		<label for="name">
			<User size={16} />
			Name (for registration)
		</label>
		<input id="name" name="name" placeholder="Your name" />
	</div>
	<div class="form-actions">
		<button type="submit" class="btn-primary">Login</button>
		<button type="submit" formaction="?/signUpEmail">Register</button>
	</div>
</form>
{#if form?.message}
	<p class="error">{form.message}</p>
{/if}
