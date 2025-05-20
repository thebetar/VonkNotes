import { createSignal } from 'solid-js';

import NotesList from '../components/notes/NotesList';
import NotesPreview from '../components/notes/NotesPreview';

function NotesPage() {
	const [addMode, setAddMode] = createSignal(false);

	return (
		<div class="flex h-full lg:min-h-screen min-h-[calc(100vh-56px)] relative">
			{/* Sidebar for notes */}
			<NotesList setAddMode={setAddMode} />

			{/* Note content */}
			<NotesPreview addMode={addMode} setAddMode={setAddMode} />
		</div>
	);
}

export default NotesPage;
