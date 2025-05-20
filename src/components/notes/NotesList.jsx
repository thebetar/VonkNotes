import { createEffect, createSignal } from 'solid-js';
import { useParams } from '@solidjs/router';

import PlusSvg from '../../assets/svg/used/plus.svg';
import UploadSvg from '../../assets/svg/used/upload.svg';
import NotesUploadModal from './NotesUploadModal';

import { useNotes } from '../../services/notes';

const STARTS_WITH_FILTER = ['#', '-', 'title:', 'uuid:', 'version:', 'created:', 'tags:'];
const MAX_PREVIEW_LENGTH = 80;

function NotesList({ setAddMode }) {
	const notesStore = useNotes();

	const notes = () => notesStore.notes;
	const currentNote = () => notesStore.currentNote;

	const [filter, setFilter] = createSignal('');
	const [filteredNotes, setFilteredNotes] = createSignal([]);
	const [showUploadModal, setShowUploadModal] = createSignal(false);

	const params = useParams();

	function getPreviewDescription(content) {
		const lines = content.split('\n');

		let preview;

		if (lines.length > 1) {
			preview = lines
				.filter(l => !STARTS_WITH_FILTER.some(prefix => l.trim().startsWith(prefix)) && l.trim().length > 0)
				.slice(0, 2)
				.join(' ');
		} else {
			preview = lines[0];
		}

		if (preview.length > MAX_PREVIEW_LENGTH) {
			preview = preview.slice(0, MAX_PREVIEW_LENGTH) + '...';
		}

		return preview;
	}

	function getFilteredNotes() {
		return notes()
			.filter(n => `${n.title.toLowerCase()} ${n.content.toLowerCase()}`.includes(filter().toLowerCase()))
			.sort((a, b) => {
				// Matching .name should be prioritized
				const aTitle = a.title.toLowerCase().includes(filter().toLowerCase());
				const bTitle = b.title.toLowerCase().includes(filter().toLowerCase());

				if (aTitle && !bTitle) {
					return -1;
				}

				if (!aTitle && bTitle) {
					return 1;
				}

				const aUpdatedAt = new Date(a.updated_at);
				const bUpdatedAt = new Date(b.updated_at);

				if (aUpdatedAt > bUpdatedAt) {
					return -1;
				}
				if (aUpdatedAt < bUpdatedAt) {
					return 1;
				}

				return 0;
			});
	}

	createEffect(() => {
		function runFilter() {
			if (params.tagId) {
				const tagId = Number(params.tagId.toLowerCase() || -1);
				setFilteredNotes(getFilteredNotes().filter(n => n.tags.some(t => t.id === tagId)));
				return;
			}

			setFilteredNotes(getFilteredNotes());
		}

		if (notes().length > 0) {
			runFilter();
		}
	}, [notes(), filter, params]);

	return (
		<aside class="lg:w-80 w-screen bg-zinc-800 border-r border-zinc-700 lg:h-screen flex flex-col">
			<div class="flex items-center justify-between px-4 py-5 border-b border-zinc-700">
				<h2 class="text-xl font-bold">Notes</h2>

				<div className="flex gap-x-2">
					<button
						class="p-1 rounded-full hover:bg-zinc-700 transition cursor-pointer"
						title="Import notes"
						onClick={() => setShowUploadModal(true)}
					>
						<img src={UploadSvg} class="w-5 h-5" alt="Import" />
					</button>

					<button
						class="p-1 rounded-full hover:bg-zinc-700 transition cursor-pointer"
						title="Add note"
						onClick={() => setAddMode(true)}
					>
						<img src={PlusSvg} class="w-6 h-6" alt="Add" />
					</button>
				</div>
			</div>

			<div class="px-4 py-2 border-b border-zinc-700">
				<input
					type="text"
					class="w-full px-2 py-1 rounded bg-zinc-700 border border-zinc-600 text-white placeholder-zinc-400 text-sm focus:outline-none"
					placeholder="Filter notes..."
					value={filter()}
					onInput={e => setFilter(e.target.value)}
				/>
			</div>

			<ul class="flex-1 overflow-y-scroll overflow-x-hidden">
				{filteredNotes().map(note => (
					<li
						class={`relative group h-24 flex items-center justify-between px-2 py-3 border-b border-zinc-700 cursor-pointer hover:bg-zinc-700 transition-colors ${
							currentNote()?.title === note.title ? 'bg-zinc-700/60 font-semibold' : ''
						}`}
						onClick={() => {
							localStorage.setItem('currentNote', note.title);
							notesStore.setCurrentNote(note);
						}}
					>
						<div class="overflow-hidden w-full">
							<div class="truncate">{note.title}</div>

							<div class="italic text-sm text-zinc-400">{getPreviewDescription(note.content)}</div>
						</div>
					</li>
				))}
			</ul>

			{showUploadModal() && <NotesUploadModal close={() => setShowUploadModal(false)} />}
		</aside>
	);
}

export default NotesList;
