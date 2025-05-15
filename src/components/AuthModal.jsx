import { createSignal } from 'solid-js';

export default function AuthModal({ onSuccess }) {
	const [mode, setMode] = createSignal('login'); // 'login' or 'register'
	const [email, setEmail] = createSignal('');
	const [password, setPassword] = createSignal('');
	const [loading, setLoading] = createSignal(false);
	const [error, setError] = createSignal('');

	const handleSubmit = async e => {
		e.preventDefault();
		setLoading(true);
		setError('');

		const action = mode() === 'login' ? 'login' : 'register';

		try {
			const res = await fetch(`/api/auth.php?action=${action}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: email(), password: password() }),
			});

			const data = await res.json();

			if (!data.success) {
				setError(data.error || 'Failed');
				setLoading(false);
				return;
			}

			setEmail('');
			setPassword('');
			setError('');

			onSuccess(data.user);
		} catch (err) {
			setError('Network error');
		}
		setLoading(false);
	};

	return (
		<div class="fixed top-0 left-0 h-screen w-screen z-50 flex items-center justify-center bg-black/60">
			<form
				class="bg-zinc-800 text-white py-8 px-6 rounded-lg shadow-lg w-full max-w-sm flex flex-col gap-6 border border-zinc-900"
				style={{ minWidth: '320px' }}
				onSubmit={handleSubmit}
			>
				<div class="flex flex-col items-center gap-2">
					<h2 class="text-xl font-bold mb-1">{mode() === 'login' ? 'Login' : 'Register'}</h2>
					<p class="text-zinc-400 text-sm">
						{mode() === 'login' ? 'Sign in to access your notes' : 'Create an account to get started'}
					</p>
				</div>

				{error() && <div class="bg-red-100 text-red-700 px-3 py-2 rounded text-sm text-center">{error()}</div>}

				<div class="flex flex-col gap-2">
					<label class="text-sm font-medium" for="auth-email">
						Email
					</label>
					<input
						id="auth-email"
						type="email"
						class="w-full p-2 border border-zinc-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400"
						placeholder="you@email.com"
						value={email()}
						onInput={e => setEmail(e.target.value)}
						required
						autocomplete="username"
					/>
				</div>

				<div class="flex flex-col gap-2">
					<label class="text-sm font-medium" for="auth-password">
						Password
					</label>
					<input
						id="auth-password"
						type="password"
						class="w-full p-2 border border-zinc-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400"
						placeholder="Your password"
						value={password()}
						onInput={e => setPassword(e.target.value)}
						required
						autocomplete={mode() === 'login' ? 'current-password' : 'new-password'}
					/>
				</div>

				<button
					type="submit"
					class={`bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-semibold mt-2 ${
						loading() ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
					}`}
					disabled={loading()}
				>
					{loading()
						? mode() === 'login'
							? 'Logging in...'
							: 'Registering...'
						: mode() === 'login'
						? 'Log In'
						: 'Register'}
				</button>

				<div class="text-center text-sm text-zinc-400">
					{mode() === 'login' ? (
						<>
							Don't have an account?{' '}
							<button
								type="button"
								class="text-indigo-400 hover:underline"
								onClick={() => {
									setMode('register');
									setError('');
								}}
							>
								Register
							</button>
						</>
					) : (
						<>
							Already have an account?{' '}
							<button
								type="button"
								class="text-indigo-400 hover:underline"
								onClick={() => {
									setMode('login');
									setError('');
								}}
							>
								Log In
							</button>
						</>
					)}
				</div>
			</form>
		</div>
	);
}
