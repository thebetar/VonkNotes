import { createSignal } from 'solid-js';

import { useNotes } from '../../services/notes';
import MarkdownPreview from '../MarkdownPreview';
import NotesPreviewForm from './NotesPreviewForm';
import NotesPreviewTags from './NotesPreviewTags';

import PencilSvg from '../../assets/svg/used/pencil.svg';
import TrashSvg from '../../assets/svg/used/trash.svg';
import ArrowLeftSvg from '../../assets/svg/used/arrow-left.svg';

function NotesPreview({ addMode, setAddMode }) {
	const notesStore = useNotes();

	const [editMode, setEditMode] = createSignal(false);

	async function deleteNote() {
		const currentNote = notesStore.currentNote();

		if (!window.confirm(`Delete note "${currentNote.title}"?`)) {
			return;
		}

		await fetch(`${window.location.origin}/api/notes.php?id=${currentNote.id}`, { method: 'DELETE' });
		await notesStore.fetch();

		notesStore.setCurrentNote(null);
	}

	return (
		<main
			class={`flex-1 lg:p-8 p-4 pb-16 overflow-y-auto bg-zinc-800 lg:relative absolute top-0 left-0 right-0 lg:z-0 z-10 min-h-screen lg:block ${
				notesStore.currentNote() || addMode() ? '' : 'hidden'
			}`}
		>
			{addMode() ? (
				<div class="max-w-4xl mx-auto">
					<NotesPreviewForm close={() => setAddMode(false)} />
				</div>
			) : editMode() ? (
				<div class="max-w-4xl mx-auto">
					<NotesPreviewForm close={() => setEditMode(false)} update note={notesStore.currentNote()} />
				</div>
			) : notesStore.currentNote() ? (
				<>
					<button
						class="lg:hidden block underline text-sm mb-4"
						onClick={() => notesStore.setCurrentNote(null)}
					>
						<img src={ArrowLeftSvg} class="w-4 h-4 inline-block mr-1" alt="Back" /> Back to notes
					</button>

					<div class="flex items-center justify-between mb-4 relative">
						<h1 class="text-2xl font-bold flex-1">{notesStore.currentNote().title}</h1>

						<div class="flex gap-x-1">
							<button
								class="p-2 rounded-full hover:bg-indigo-700/50 cursor-pointer"
								title="Edit note"
								onClick={() => setEditMode(true)}
							>
								<img src={PencilSvg} class="w-5 h-5" alt="Edit" />
							</button>

							<button
								class="p-2 rounded-full hover:bg-red-700/50 cursor-pointer"
								title="Delete note"
								onClick={e => {
									e.stopPropagation();
									deleteNote();
								}}
							>
								<img src={TrashSvg} class="w-5 h-5" alt="Delete" />
							</button>
						</div>
					</div>
					{/* Tag management */}
					<NotesPreviewTags />

					{/* Markdown preview */}
					<div className="max-w-4xl mx-auto">
						<MarkdownPreview content={notesStore.currentNote().content} />
					</div>
				</>
			) : (
				<p class="text-zinc-400">Select a note to view its content.</p>
			)}
		</main>
	);
}

export default NotesPreview;
