import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { movie } from '$lib/server/db/schema';
import { and, desc, eq } from 'drizzle-orm';

export const load: PageServerLoad = async (event) => {
	if (!event.locals.user) {
		return redirect(302, '/login');
	}
	const movies = await db
		.select()
		.from(movie)
		.where(eq(movie.userId, event.locals.user.id))
		.orderBy(desc(movie.createdAt));
	return { user: event.locals.user, movies };
};

export const actions: Actions = {
	addMovie: async (event) => {
		if (!event.locals.user) {
			return redirect(302, '/login');
		}
		const formData = await event.request.formData();
		const title = formData.get('title')?.toString()?.trim() ?? '';
		if (!title) {
			return { success: false, message: 'Title is required' };
		}
		await db.insert(movie).values({
			title,
			userId: event.locals.user.id
		});
		return { success: true };
	},
	removeMovie: async (event) => {
		if (!event.locals.user) {
			return redirect(302, '/login');
		}
		const formData = await event.request.formData();
		const id = formData.get('id');
		const parsedId = typeof id === 'string' ? parseInt(id, 10) : NaN;
		if (!Number.isInteger(parsedId) || parsedId < 1) {
			return { success: false, message: 'Invalid movie' };
		}
		await db
			.delete(movie)
			.where(and(eq(movie.id, parsedId), eq(movie.userId, event.locals.user.id)));
		return { success: true, removedId: parsedId };
	},
};
