import { createSignal } from 'solid-js';

import MarkdownEditor from '../MarkdownEditor';
import { useNotes } from '../../services/notes';

function NotesPreviewForm({ note, close, update = false }) {
	const notesStore = useNotes();

	const [noteTitle, setNoteTitle] = createSignal(update ? note.title : '');
	const [noteContent, setNoteContent] = createSignal(update ? note.content : '');
	const [loading, setLoading] = createSignal(false);

	async function save() {
		if (!noteTitle().trim()) {
			return;
		}

		setLoading(true);

		let res;

		if (!update) {
			res = await fetch(`${window.location.origin}/api/notes.php`, {
				method: 'POST',
				body: JSON.stringify({
					title: noteTitle(),
					content: noteContent(),
				}),
				headers: {
					'Content-Type': 'application/json',
				},
			});
		} else {
			res = await fetch(`${window.location.origin}/api/notes.php?id=${note.id}`, {
				method: 'PUT',
				body: JSON.stringify({
					title: noteTitle(),
					content: noteContent(),
				}),
				headers: { 'Content-Type': 'application/json' },
			});
		}

		notesStore.fetch();
		notesStore.setCurrentNote({
			title: noteTitle(),
			content: noteContent(),
			tags: [],
		});

		setLoading(false);

		close();
	}

	return (
		<div>
			<div className="w-full flex justify-between items-center mb-4">
				<h2 class="text-xl font-bold">{!update ? 'Add Note' : 'Edit Note'}</h2>

				<div class="flex gap-2">
					<button
						class="px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700 transition cursor-pointer"
						onClick={save}
						disabled={loading()}
					>
						Save
					</button>
					<button
						class="px-4 py-2 rounded bg-zinc-700 text-white font-semibold hover:bg-zinc-600 transition  cursor-pointer"
						onClick={close}
						disabled={loading()}
					>
						Cancel
					</button>
				</div>
			</div>

			<input
				class="w-full mb-3 px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-white"
				placeholder="Note title (e.g. My first note)"
				value={noteTitle()}
				onInput={e => setNoteTitle(e.target.value)}
			/>

			<MarkdownEditor
				value={noteContent()}
				onInput={e => setNoteContent(e)}
				placeholder="Write your note here... (supports Markdown)"
				class="w-full mb-3 px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-white min-h-96"
			/>

			<div class="flex gap-2 mt-4">
				<button
					class="px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700 transition cursor-pointer"
					onClick={save}
					disabled={loading()}
				>
					Save
				</button>
				<button
					class="px-4 py-2 rounded bg-zinc-700 text-white font-semibold hover:bg-zinc-600 transition  cursor-pointer"
					onClick={close}
					disabled={loading()}
				>
					Cancel
				</button>
			</div>
		</div>
	);
}

export default NotesPreviewForm;
