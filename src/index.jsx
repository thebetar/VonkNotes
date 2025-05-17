/* @refresh reload */
import { render } from 'solid-js/web';
import { Router, Route } from '@solidjs/router';

import './index.css';
import App from './App';
import NotesPage from './routes/NotesPage';
import RedirectPage from './routes/RedirectPage';
import TagsPage from './routes/TagsPage';

const root = document.getElementById('root');

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
	throw new Error(
		'Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?',
	);
}

render(
	() => (
		<Router root={App}>
			<Route path="/notes" component={NotesPage} />
			<Route path="/notes/tag/:tagId" component={NotesPage} />
			<Route path="/tags" component={TagsPage} />
			<Route path="*" component={RedirectPage} />
		</Router>
	),
	root,
);
