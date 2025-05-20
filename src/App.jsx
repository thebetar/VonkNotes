import { createSignal, onMount } from 'solid-js';
import { A, useLocation } from '@solidjs/router';

import { useNotes } from './services/notes';
import { useTags } from './services/tags';

import routes from './constants/routes';
import PowerOffSvg from './assets/svg/used/power-off.svg';
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

	const handleLogout = async () => {
		await fetch(`${window.location.origin}/api/auth.php?action=logout`, { method: 'POST' });
		setLoginModal(true);
	};

	const renderNavItem = item => (
		<A
			class="flex items-center gap-x-2 text-white hover:opacity-80 transition-opacity px-6 py-4 lg:w-full w-28"
			activeClass="bg-zinc-700"
			href={item.href}
		>
			<img src={item.icon} class="w-4 h-4" /> {item.name}
		</A>
	);

	const renderTagItem = item => {
		let href = `/notes/tag/${item.id}`;

		if (location.pathname === href) {
			href = '/notes';
		}

		return (
			<A
				class="flex items-center w-fit gap-x-1 text-white hover:opacity-80 transition-opacity px-2 py-1 rounded-md bg-indigo-900/50"
				activeClass="bg-indigo-800/90 font-semibold"
				href={href}
			>
				<img src={TagIcon} class="w-4 h-4" />
				{item.name}
			</A>
		);
	};

	return (
		<div class="flex">
			<nav class="bg-zinc-900 text-white shadow-md z-50 max-h-screen flex lg:flex-col flex-row lg:h-screen h-14 lg:w-80 w-full lg:relative fixed bottom-0 left-0 right-0 lg:items-start items-center lg:justify-start justify-between">
				<header class="text-xl font-semibold px-4 pt-6 pb-4 lg:block hidden">Assist AI</header>

				<div class="flex lg:flex-col flex-row lg:w-full w-full justify-between">
					{routes.map(renderNavItem)}
					<button
						class="lg:hidden flex items-center gap-x-1 text-white hover:opacity-80 transition-opacity px-6 py-4 lg:w-full w-28"
						onClick={() => setLoginModal(true)}
					>
						<img src={PowerOffSvg} class="w-4 h-4" />
						Logout
					</button>
				</div>

				<div className="flex-1 lg:flex hidden flex-col">
					<header class="text-xl font-semibold px-4 pt-6 pb-2">Tags</header>

					<ul class="flex flex-col gap-2 px-4 flex-1 overflow-y-auto py-2">
						{tagsStore.tags.map(renderTagItem)}
					</ul>
				</div>

				{/* Logout button at the bottom */}
				<div class="lg:px-4 w-full lg:pb-4 lg:mt-auto items-center lg:flex hidden">
					<button
						class="w-full flex items-center justify-center gap-2 px-3 py-2 lg:bg-zinc-700 hover:bg-zinc-600 rounded text-sm text-zinc-200 cursor-pointer transition-colors"
						onClick={handleLogout}
					>
						<img src={PowerOffSvg} class="w-4 h-4" />
						Log out
					</button>
				</div>
			</nav>

			<div class="h-screen w-screen bg-zinc-800 text-white">
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
