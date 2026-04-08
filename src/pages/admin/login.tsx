import { useState, type FC } from 'react';
import { supabase } from '@/utils/supabase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faSignInAlt } from '@fortawesome/free-solid-svg-icons';

const Login: FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { data, error: queryError } = await supabase.from('account').select('username, pass').eq('username', username).eq('pass', password).single();

            if (queryError) {
                setError('sai rồi má');
            } else if (data) {
                localStorage.setItem('daubuoi', 'authenticated');
                window.location.reload();
            } else {
                setError('sai rồi má');
            }
        } catch {
            setError('có lỗi ní ơi');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='flex min-h-screen items-center justify-center bg-white px-4 py-12 sm:px-6 lg:px-8'>
            <div className='w-full max-w-md space-y-8'>
                <div></div>
                <form className='mt-8 space-y-6' onSubmit={handleSubmit}>
                    <div className='-space-y-px rounded-md shadow-sm'>
                        <div>
                            <label htmlFor='username' className='sr-only'>
                                Username
                            </label>
                            <input id='username' name='username' type='text' required className='relative block w-full appearance-none rounded-none rounded-t-md border border-gray-300 px-3 py-2 text-black focus:z-10 focus:border-black focus:ring-black focus:outline-none sm:text-sm' value={username} onChange={(e) => setUsername(e.target.value)} disabled={loading} />
                        </div>
                        <div>
                            <label htmlFor='password' className='sr-only'>
                                Password
                            </label>
                            <input id='password' name='password' type='password' required className='relative block w-full appearance-none rounded-none rounded-b-md border border-gray-300 px-3 py-2 text-black focus:z-10 focus:border-black focus:ring-black focus:outline-none sm:text-sm' value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} />
                        </div>
                    </div>

                    {error && (
                        <div className='rounded-md border border-gray-300 bg-gray-100 p-4'>
                            <div className='text-sm text-black'>{error}</div>
                        </div>
                    )}

                    <div>
                        <button type='submit' disabled={loading} className='group relative flex w-full justify-center rounded-md border border-black bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 focus:ring-2 focus:ring-black focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50'>
                            {loading ? (
                                <div className='flex items-center'>
                                    <FontAwesomeIcon icon={faSpinner} className='mr-3 -ml-1 h-5 w-5 animate-spin text-white' />
                                </div>
                            ) : (
                                <FontAwesomeIcon icon={faSignInAlt} className='h-5 w-5 text-white' />
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
