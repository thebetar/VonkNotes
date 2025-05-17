import { createSignal, onMount } from 'solid-js';
import { A, useLocation } from '@solidjs/router';

import { useNotes } from './services/notes';
import { useTags } from './services/tags';

import routes from './constants/routes';
import TagIcon from './assets/svg/used/tag.svg';
import AuthModal from './components/AuthModal';

function App(props) {
	const [loginModal, setLoginModal] = createSignal(false);

	const notesStore = useNotes();
	const tagsStore = useTags();

	const location = useLocation();

	const initialiseApplication = async () => {
		const notesRes = await notesStore.fetch();
		const tagsRes = await tagsStore.fetch();

		if (!notesRes || !tagsRes) {
			setLoginModal(true);
		}

		const notes = notesStore.notes;

		if (notes && notes.length === 0) {
			notesStore.setCurrentNote(null);
			return;
		}

		if (localStorage.getItem('currentNote')) {
			const local = notes.find(n => n.title === localStorage.getItem('currentNote'));

			if (local) {
				notesStore.setCurrentNote(local);
				return;
			}
		}

		notesStore.setCurrentNote(null);
	};

	onMount(() => {
		initialiseApplication();
	});

	const renderNavItem = item => (
		<li>
			<A
				class="flex items-center gap-x-2 text-white hover:opacity-80 transition-opacity px-6 py-4"
				activeClass="bg-zinc-700"
				href={item.href}
			>
				<img src={item.icon} class="w-4 h-4" /> {item.name}
			</A>
		</li>
	);

	const renderTagItem = item => {
		let href = `/notes/tag/${item.id}`;

		if (location.pathname === href) {
			href = '/notes';
		}

		return (
			<li>
				<A
					class="flex items-center w-fit gap-x-1 text-white hover:opacity-80 transition-opacity px-2 py-1 bg-indigo-800/30 rounded-md"
					activeClass="bg-indigo-800/90 font-semibold"
					href={href}
				>
					<img src={TagIcon} class="w-4 h-4" />
					{item.name}
				</A>
			</li>
		);
	};

	return (
		<div class="flex">
			<nav class="bg-zinc-900 h-screen w-80 text-white shadow-md z-50 relative max-h-screen flex flex-col">
				<header class="text-xl font-semibold px-4 pt-6 pb-4">Assist AI</header>

				<ul>{routes.map(renderNavItem)}</ul>

				<header class="text-xl font-semibold px-4 pt-6 pb-2">Tags</header>

				<ul class="flex flex-col gap-2 px-4 flex-1 overflow-y-auto py-2">
					{tagsStore.tags.map(renderTagItem)}
				</ul>
			</nav>

			<div class="h-screen w-screen overflow-y-scroll bg-zinc-800 text-white">
				{loginModal() ? (
					<AuthModal
						onSuccess={() => {
							setLoginModal(false);
							initialiseApplication();
						}}
					/>
				) : (
					props.children
				)}
			</div>
		</div>
	);
}

export default App;
