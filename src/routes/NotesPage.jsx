import { createSignal } from 'solid-js';

import NotesList from '../components/notes/NotesList';
import NotesPreview from '../components/notes/NotesPreview';

function NotesPage() {
	const [addMode, setAddMode] = createSignal(false);

	return (
		<div class="flex h-full min-h-screen">
			{/* Sidebar for notes */}
			<NotesList setAddMode={setAddMode} />

			{/* Note content */}
			<NotesPreview addMode={addMode} setAddMode={setAddMode} />
		</div>
	);
}

export default NotesPage;
